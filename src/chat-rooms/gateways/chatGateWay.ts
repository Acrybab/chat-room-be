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

@WebSocketGateway({
  cors: {
    origin: '*', // tùy config frontend
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatRoomService: ChatRoomService,
    private readonly messageService: MessageService,
  ) {}

  @WebSocketServer()
  server: Server;

  private userSockets = new Map<number, string>(); // userId -> socketId
  private roomMembers = new Map<number, Set<number>>(); // roomId -> userId[]

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    const userId = Number(client.handshake.query.userId);
    if (userId) {
      this.userSockets.set(userId, client.id);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.userSockets.forEach((socketId, userId) => {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        // xóa user ra khỏi tất cả room đã tham gia
        this.roomMembers.forEach((members, roomId) => {
          if (members.has(userId)) {
            members.delete(userId);
            this.server.to(`room-${roomId}`).emit('userLeft', { userId });
          }
        });
      }
    });
  }

  getSocketIdByUserId(userId: number): string | undefined {
    return this.userSockets.get(userId);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { roomId: string; userId: number; content: string },
  ) {
    const message = await this.messageService.createMessage(
      data.content,
      data.userId,
      parseInt(data.roomId, 10),
    );

    this.server.to(`room-${data.roomId}`).emit('newMessage', {
      id: message.id,
      roomId: message.chatRoom.id,
      user: {
        id: message.user.id,
        email: message.user.email,
      },
      content: message.content,
      createdAt: message.createdAt,
    });

    return {
      ok: true,
      message: {
        id: message.id,
        roomId: message.chatRoom.id,
        userId: message.user.id,
        content: message.content,
        createdAt: message.createdAt,
      },
    };
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { userId: number; roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.chatRoomService.joinChatRoom(
      data.userId,
      data.roomId,
    );

    if (result.data.chatRoomMember) {
      void client.join(`room-${data.roomId}`);

      // lưu user vào danh sách room
      if (!this.roomMembers.has(data.roomId)) {
        this.roomMembers.set(data.roomId, new Set());
      }
      this.roomMembers.get(data.roomId)?.add(data.userId);

      // thông báo cho mọi người trong room
      this.server.to(`room-${data.roomId}`).emit('userJoined', {
        userId: data.userId,
      });

      // gửi danh sách user hiện tại trong room cho client mới
      this.server.to(client.id).emit('roomUsers', {
        users: Array.from(this.roomMembers.get(data.roomId) ?? []),
      });
    }

    return result;
  }

  @SubscribeMessage('callUser')
  handleCallUser(
    @MessageBody()
    data: {
      fromUserId: number;
      toUserId: number;
      offer: RTCSessionDescriptionInit;
    },
  ) {
    const targetSocketId = this.getSocketIdByUserId(data.toUserId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('incomingCall', {
        fromUserId: data.fromUserId,
        offer: data.offer,
      });
    }
  }

  @SubscribeMessage('answerCall')
  handleAnswerCall(
    @MessageBody()
    data: {
      fromUserId: number;
      toUserId: number;
      answer: RTCSessionDescriptionInit;
    },
  ) {
    const targetSocketId = this.getSocketIdByUserId(data.toUserId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('callAnswered', {
        fromUserId: data.fromUserId,
        answer: data.answer,
      });
    }
  }

  @SubscribeMessage('iceCandidate')
  handleIceCandidate(
    @MessageBody()
    data: {
      fromUserId: number;
      toUserId: number;
      candidate: RTCIceCandidateInit;
    },
  ) {
    const targetSocketId = this.getSocketIdByUserId(data.toUserId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('iceCandidate', {
        fromUserId: data.fromUserId,
        candidate: data.candidate,
      });
    }
  }
  @SubscribeMessage('sendFile')
  async handleFileMessage(
    @MessageBody()
    data: {
      roomId: number;
      userId: number;
      fileUrl: string;
    },
  ) {
    const message = await this.messageService.createFileMessage(
      data.fileUrl,
      data.userId,
      data.roomId,
    );

    this.server.to(`room-${data.roomId}`).emit('newMessage', {
      id: message.id,
      roomId: message.chatRoom.id,
      user: {
        id: message.user.id,
        email: message.user.email,
      },
      fileUrl: message.fileUrl,
      createdAt: message.createdAt,
    });

    return { ok: true, message };
  }
}
