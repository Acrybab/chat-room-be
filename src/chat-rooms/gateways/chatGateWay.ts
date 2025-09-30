import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatRoomService } from '../services/chat-room.service';
import { MessageService } from 'src/messages/services/message.service';
import { UserService } from 'src/core/users/services/user.services';

import * as mediasoup from 'mediasoup';
import { types as mediasoupTypes } from 'mediasoup';
interface ActiveCall {
  callId: string;
  roomId: number;
  initiator: number;
  participants: Set<number>;
  pending: Set<number>;
  startedAt: number;
}
interface Peer {
  socketId: string;
  userId?: number;
  transports: Set<string>;
  producers: Set<string>;
  consumers: Set<string>;
  roomId?: number;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatRoomService: ChatRoomService,
    private readonly messageService: MessageService,
    private readonly userService: UserService,
  ) {}

  @WebSocketServer() server: Server;

  private userSockets = new Map<number, string>();
  private roomMembers = new Map<number, Set<number>>();
  private activeCalls = new Map<string, ActiveCall>(); // callId làm key
  private typingUsers = new Map<number, Set<number>>(); // roomId -> Set<userId>
  private typingTimeouts = new Map<string, NodeJS.Timeout>(); // "roomId-userId" -> timeout

  // media soup variables
  private worker: mediasoupTypes.Worker;
  private routers = new Map<number, mediasoupTypes.Router>();
  private transports = new Map<string, mediasoupTypes.WebRtcTransport>(); // transportId -> transport
  private producers = new Map<string, mediasoupTypes.Producer>(); // producerId -> producer
  private consumers = new Map<string, mediasoupTypes.Consumer>(); // consumerId -> consumer
  private peers = new Map<string, Peer>(); // socket.id -> Peer

  async onModuleInit() {
    // create mediasoup worker
    this.worker = await mediasoup.createWorker({
      rtcMinPort: Number(process.env.MEDIASOUP_MIN_PORT || 40000),
      rtcMaxPort: Number(process.env.MEDIASOUP_MAX_PORT || 49999),
      logLevel: 'warn',
      logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp'],
    });

    this.worker.on('died', () => {
      console.error('mediasoup worker died, exiting in 2 seconds...'); // production: restart strategy
      setTimeout(() => process.exit(1), 2000);
    });

    console.log('mediasoup worker created');
  }

  async handleConnection(client: Socket) {
    const userId = Number(
      client.handshake.auth?.userId || client.handshake.query?.userId,
    );
    // store user socket
    if (!this.peers.has(client.id)) {
      this.peers.set(client.id, {
        socketId: client.id,
        transports: new Set(),
        producers: new Set(),
        consumers: new Set(),
      });
    }
    if (userId) {
      await client.join(`user-${userId}`);
      const existingSocketId = this.userSockets.get(userId);
      if (existingSocketId && existingSocketId !== client.id) {
        this.server.sockets.sockets.get(existingSocketId)?.disconnect(true);
      }
      this.userSockets.set(userId, client.id);
      await this.userService.updateStatus(userId, true);
      this.server.emit('userStatusChanged', {
        userId,
        status: true,
        isOnline: true,
      });

      const peer = this.peers.get(client.id)!;
      peer.userId = userId;
    }
  }

  async handleDisconnect(client: Socket) {
    // cleanup mediasoup resources for this socket
    const peer = this.peers.get(client.id);
    if (peer) {
      // close producers
      for (const prodId of Array.from(peer.producers)) {
        const producer = this.producers.get(prodId);
        if (producer) {
          try {
            producer.close();
          } catch (e) {
            console.log(e);
          }
          this.producers.delete(prodId);
        }
      }

      // close consumers
      for (const consId of Array.from(peer.consumers)) {
        const consumer = this.consumers.get(consId);
        if (consumer) {
          try {
            consumer.close();
          } catch (e) {
            console.log(e);
          }
          this.consumers.delete(consId);
        }
      }

      // close transports
      for (const transId of Array.from(peer.transports)) {
        const transport = this.transports.get(transId);
        if (transport) {
          try {
            transport.close();
          } catch (e) {
            console.log(e);
          }
          this.transports.delete(transId);
        }
      }

      this.peers.delete(client.id);
    }

    // existing user disconnect logic (from your original code)
    let disconnectedUserId: number | null = null;
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        disconnectedUserId = userId;
        this.userSockets.delete(userId);
        break;
      }
    }

    if (!disconnectedUserId) return;

    await this.userService.updateStatus(disconnectedUserId, false);
    this.server.emit('userStatusChanged', {
      userId: disconnectedUserId,
      status: false,
      isOnline: false,
    });

    this.roomMembers.forEach((members, roomId) => {
      if (members.has(disconnectedUserId)) {
        members.delete(disconnectedUserId);
        this.server
          .to(`room-${roomId}`)
          .emit('userLeft', { userId: disconnectedUserId });

        // Clean up typing state
        this.handleStopTypingInternal(roomId, disconnectedUserId);

        // Check active calls in this room
        this.activeCalls.forEach((call) => {
          if (call.roomId === roomId) {
            call.participants.delete(disconnectedUserId);
            call.pending.delete(disconnectedUserId);
            this.server.to(`room-${roomId}`).emit('groupParticipantLeft', {
              callId: call.callId,
              userId: disconnectedUserId,
            });
            if (call.participants.size === 0 && call.pending.size === 0) {
              this.activeCalls.delete(call.callId);
            }
          }
        });
      }
    });
  }

  @SubscribeMessage('startCall')
  async handleStartCall(
    @MessageBody()
    data: { roomId: number; userId: number; callType: 'video' | 'audio' },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId, callType } = data;

    // Kiểm tra user có trong room không
    const roomMembersList = this.roomMembers.get(roomId);
    if (!roomMembersList || !roomMembersList.has(userId)) {
      return { success: false, error: 'User not in room' };
    }

    // Kiểm tra có cuộc gọi đang diễn ra trong room này không
    const existingCall = Array.from(this.activeCalls.values()).find(
      (call) => call.roomId === roomId,
    );
    if (existingCall) {
      return { success: false, error: 'Call already in progress in this room' };
    }

    // Tạo callId unique
    const callId = `call_${roomId}_${userId}_${Date.now()}`;

    // Lấy danh sách members trong room (trừ initiator)
    const otherMembers = Array.from(roomMembersList).filter(
      (memberId) => memberId !== userId,
    );

    // Tạo active call
    const activeCall: ActiveCall = {
      callId,
      roomId,
      initiator: userId,
      participants: new Set([userId]), // initiator tự động join
      pending: new Set(otherMembers), // các thành viên khác đang pending
      startedAt: Date.now(),
    };

    this.activeCalls.set(callId, activeCall);

    // Lấy thông tin user initiator
    const initiatorUser = await this.userService.findById(userId);

    // Gửi inComingGroupCall cho tất cả members khác trong room
    const callData = {
      callId,
      roomId,
      callType,
      initiator: {
        id: userId,
        email: initiatorUser?.email || 'Unknown',
      },
      participants: [userId],
      timestamp: Date.now(),
    };

    // Emit cho tất cả members trong room trừ initiator
    client.to(`room-${roomId}`).emit('inComingGroupCall', callData);

    // Gửi response cho initiator
    client.emit('callStarted', {
      callId,
      roomId,
      participants: [userId],
      pending: otherMembers,
    });

    console.log(
      `Group call started by user ${userId} in room ${roomId}, callId: ${callId}`,
    );

    return { success: true, callId, roomId };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { roomId: number; userId: number; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(client);
    const message = await this.messageService.createMessage(
      data.content,
      data.userId,
      data.roomId,
    );
    const payload = {
      id: message.id,
      isOwn: false,
      content: message.content,
      createdAt: message.createdAt,
      user: { id: message.user.id, email: message.user.email },
      chatRoom: { id: message.chatRoom.id },
      type: 'text',
    };
    this.server.to(`room-${data.roomId}`).emit('newMessage', payload);
    return { ok: true, message: payload };
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { userId?: number; roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(`room-${data.roomId}`);
    if (data.userId) {
      if (!this.roomMembers.has(data.roomId))
        this.roomMembers.set(data.roomId, new Set());
      this.roomMembers.get(data.roomId)?.add(data.userId);
      client
        .to(`room-${data.roomId}`)
        .emit('userJoined', { userId: data.userId, roomId: data.roomId });
      client.emit('roomUsers', {
        roomId: data.roomId,
        users: Array.from(this.roomMembers.get(data.roomId) || []),
      });
    }
    return { success: true };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { roomId: number; userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId } = data;

    // Kiểm tra user có trong room không
    if (!this.roomMembers.get(roomId)?.has(userId)) {
      return;
    }

    // Thêm user vào danh sách typing
    if (!this.typingUsers.has(roomId)) {
      this.typingUsers.set(roomId, new Set());
    }

    const typingInRoom = this.typingUsers.get(roomId)!;
    const wasTyping = typingInRoom.has(userId);
    typingInRoom.add(userId);

    // Chỉ emit nếu user chưa typing trước đó
    if (!wasTyping) {
      client.to(`room-${roomId}`).emit('typing', {
        userId,
        roomId,
      });
    }

    // Clear timeout cũ nếu có
    const timeoutKey = `${roomId}-${userId}`;
    const existingTimeout = this.typingTimeouts.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set timeout để tự động stop typing sau 3 giây
    const timeout = setTimeout(() => {
      this.handleStopTypingInternal(roomId, userId);
    }, 3000);

    this.typingTimeouts.set(timeoutKey, timeout);
  }
  @SubscribeMessage('endCall')
  handleEndCall(
    @MessageBody() data: { callId: string; roomId: number; userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const { callId, roomId, userId } = data;

    const call = this.activeCalls.get(callId);
    if (call) {
      this.activeCalls.delete(callId);
      this.server.to(`room-${roomId}`).emit('callEnded', {
        callId,
        endedBy: userId,
      });
      console.log(`Call ${callId} in room ${roomId} ended by ${userId}`);
    }
  }
  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @MessageBody() data: { roomId: number; userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(client);
    this.handleStopTypingInternal(data.roomId, data.userId);
  }

  private handleStopTypingInternal(roomId: number, userId: number) {
    // Remove user khỏi danh sách typing
    const typingInRoom = this.typingUsers.get(roomId);
    if (typingInRoom && typingInRoom.has(userId)) {
      typingInRoom.delete(userId);

      // Emit stop typing
      this.server.to(`room-${roomId}`).emit('stopTyping', {
        userId,
        roomId,
      });

      // Clean up empty set
      if (typingInRoom.size === 0) {
        this.typingUsers.delete(roomId);
      }
    }

    // Clear timeout
    const timeoutKey = `${roomId}-${userId}`;
    const timeout = this.typingTimeouts.get(timeoutKey);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(timeoutKey);
    }
  }
}
