/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import * as fs from 'fs';
import * as path from 'path';

@WebSocketGateway({
  cors: {
    origin: '*', // tùy config frontend
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatRoomService: ChatRoomService,
    private readonly messageService: MessageService,
    private readonly userService: UserService,
  ) {}

  @WebSocketServer()
  server: Server;

  private userSockets = new Map<number, string>();
  private roomMembers = new Map<number, Set<number>>();

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);

    const userId = Number(
      client.handshake.auth?.userId || client.handshake.query.userId,
    );

    if (userId) {
      console.log(`Processing user ${userId}`);

      // Join user vào personal room
      await client.join(`user-${userId}`);
      console.log(`User ${userId} joined user-${userId} room`);

      // Verify user joined successfully
      const userRoom = this.server.sockets.adapter.rooms.get(`user-${userId}`);
      console.log(`User room verification - size: ${userRoom?.size || 0}`);

      // Handle existing socket
      const existingSocketId = this.userSockets.get(userId);
      if (existingSocketId && existingSocketId !== client.id) {
        console.log(
          `User ${userId} already has socket ${existingSocketId}, replacing...`,
        );
        const existingSocket =
          this.server.sockets.sockets.get(existingSocketId);
        if (existingSocket) {
          existingSocket.disconnect(true);
        }
      }

      // Update socket mapping
      this.userSockets.set(userId, client.id);
      console.log(`Mapped user ${userId} to socket ${client.id}`);

      try {
        // Update user status
        await this.userService.updateStatus(userId, true);

        // Broadcast user online status
        this.server.emit('userStatusChanged', {
          userId,
          status: true,
          isOnline: true,
        });

        console.log(`User ${userId} is now online`);
      } catch (error) {
        console.error(`Error updating user ${userId} status:`, error);
      }
    } else {
      console.log('No userId found in connection handshake');
    }

    console.log(`Total connections: ${this.server.engine.clientsCount}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`🔌 Client disconnected: ${client.id}`);

    // Tìm userId từ socket mapping
    let disconnectedUserId: number | null = null;

    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        disconnectedUserId = userId;
        this.userSockets.delete(userId);
        break;
      }
    }

    if (disconnectedUserId) {
      try {
        // Cập nhật status offline trong DB
        await this.userService.updateStatus(disconnectedUserId, false);

        // Thông báo cho tất cả clients về user offline
        this.server.emit('userStatusChanged', {
          userId: disconnectedUserId,
          status: false,
          isOnline: false,
        });

        // Remove khỏi các room
        this.roomMembers.forEach((members, roomId) => {
          if (members.has(disconnectedUserId)) {
            members.delete(disconnectedUserId);
            this.server.to(`room-${roomId}`).emit('userLeft', {
              userId: disconnectedUserId,
            });
          }
        });

        console.log(`✅ User ${disconnectedUserId} is now offline`);
      } catch (error) {
        console.error(
          `❌ Error updating user ${disconnectedUserId} status:`,
          error,
        );
      }
    }
  }

  getSocketIdByUserId(userId: number): string | undefined {
    return this.userSockets.get(userId);
  }

  // Helper function to save base64 file to disk
  private saveBase64File(base64Data: string, fileName: string): string {
    try {
      // Remove data URL prefix (data:image/jpeg;base64,)
      const base64Content = base64Data.split(',')[1] || base64Data;

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = path.extname(fileName);
      const baseName = path.basename(fileName, extension);
      const uniqueFileName = `${baseName}_${timestamp}${extension}`;
      const filePath = path.join(uploadsDir, uniqueFileName);

      // Save file
      fs.writeFileSync(filePath, base64Content, 'base64');

      // Return relative URL
      return `/uploads/${uniqueFileName}`;
    } catch (error) {
      console.error('Error saving file:', error);
      throw new Error('Failed to save file');
    }
  }

  @SubscribeMessage('uploadFile')
  async handleFileUpload(
    @MessageBody()
    data: {
      roomId: number;
      userId: number;
      fileName: string;
      fileSize: number;
      fileType: string;
      fileData: string; // Base64 encoded file
    },
    @ConnectedSocket() client: Socket,
  ) {
    const handlerId = Math.random().toString(36).substr(2, 9);
    console.log(`📁 [Handler ${handlerId}] Received file upload:`, {
      roomId: data.roomId,
      userId: data.userId,
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileType: data.fileType,
      socketId: client.id,
    });

    try {
      // Save file to disk
      const fileUrl = this.saveBase64File(data.fileData, data.fileName);
      console.log(`💾 [Handler ${handlerId}] File saved to: ${fileUrl}`);

      // Create file message in database
      const message = await this.messageService.createFileMessage(
        fileUrl,
        data.userId,
        data.roomId,
      );

      console.log(`✅ [Handler ${handlerId}] File message saved:`, {
        id: message.id,
        fileUrl: message.fileUrl,
      });

      const messagePayload = {
        id: message.id,
        isOwn: false, // Frontend sẽ tự động set ownership
        fileUrl: message.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
        createdAt: message.createdAt,
        user: {
          id: message.user.id,
          email: message.user.email,
        },
        chatRoom: {
          id: message.chatRoom.id,
        },
        type: 'file', // Indicate this is a file message
      };

      // Emit to all clients in room
      console.log(
        `📤 [Handler ${handlerId}] Emitting file message to room-${data.roomId}`,
      );
      this.server.to(`room-${data.roomId}`).emit('newMessage', messagePayload);

      return {
        ok: true,
        message: {
          id: message.id,
          roomId: message.chatRoom.id,
          userId: message.user.id,
          fileUrl: message.fileUrl,
          fileName: data.fileName,
          createdAt: message.createdAt,
        },
      };
    } catch (error) {
      console.error(`❌ [Handler ${handlerId}] Error uploading file:`, error);

      // Send error to client
      client.emit('fileUploadError', {
        error: 'Failed to upload file',
        fileName: data.fileName,
      });

      throw error;
    }
  }
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { roomId: number; userId: number; messageId: number },
  ) {
    await this.messageService.markAsRead(data.messageId, data.userId);

    this.server.to(`room-${data.roomId}`).emit('messageRead', {
      messageId: data.messageId,
      userId: data.userId,
    });
  }

  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: { roomId: number; userId: number }) {
    this.server.to(`room-${data.roomId}`).emit('userTyping', data);
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(@MessageBody() data: { roomId: number; userId: number }) {
    this.server.to(`room-${data.roomId}`).emit('userStopTyping', data);
  }

  @SubscribeMessage('onlineUser')
  async handleUserOnline(
    @MessageBody() data: { userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`🔄 Force online update for user ${data.userId}`);

    try {
      // Cập nhật mapping nếu chưa có
      if (!this.userSockets.has(data.userId)) {
        this.userSockets.set(data.userId, client.id);
      }

      // Cập nhật DB
      await this.userService.updateStatus(data.userId, true);

      // Thông báo cho tất cả client khác
      this.server.emit('userStatusChanged', {
        userId: data.userId,
        status: true,
        isOnline: true,
      });

      return { success: true };
    } catch (error) {
      console.error(`❌ Error in handleUserOnline:`, error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody()
    data: {
      roomId: string | number;
      userId: number;
      content: string;
      type?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const handlerId = Math.random().toString(36).substr(2, 9);
    console.log(`📨 [Handler ${handlerId}] Received sendMessage:`, {
      roomId: data.roomId,
      userId: data.userId,
      content: data.content,
      socketId: client.id,
      timestamp: Date.now(),
    });

    try {
      const message = await this.messageService.createMessage(
        data.content,
        data.userId,
        parseInt(data.roomId.toString(), 10),
      );

      console.log(`✅ [Handler ${handlerId}] Message saved:`, {
        id: message.id,
        content: message.content,
      });

      const messagePayload = {
        id: message.id,
        isOwn: false, // Frontend sẽ tự động set ownership
        content: message.content,
        createdAt: message.createdAt,
        user: {
          id: message.user.id,
          email: message.user.email,
        },
        chatRoom: {
          id: message.chatRoom.id,
        },
        type: 'text', // Indicate this is a text message
      };

      // Emit cho tất cả clients trong room
      console.log(
        `📤 [Handler ${handlerId}] Emitting to ALL in room-${data.roomId}`,
      );
      this.server.to(`room-${data.roomId}`).emit('newMessage', messagePayload);

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
    } catch (error) {
      console.error(`❌ [Handler ${handlerId}] Error:`, error);
      throw error;
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { userId?: number; roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`🚪 Client joining room-${data.roomId}`, {
      userId: data.userId,
      socketId: client.id,
    });

    await client.join(`room-${data.roomId}`);

    // Nếu có userId, lưu vào room members
    if (data.userId) {
      if (!this.roomMembers.has(data.roomId)) {
        this.roomMembers.set(data.roomId, new Set());
      }
      this.roomMembers.get(data.roomId)?.add(data.userId);

      console.log(`✅ User ${data.userId} joined room-${data.roomId}`);

      // Thông báo cho những người khác trong room (có thông tin userId)
      client.to(`room-${data.roomId}`).emit('userJoined', {
        userId: data.userId,
        roomId: data.roomId,
      });

      // Gửi danh sách members hiện tại cho user mới join
      const currentMembers = Array.from(
        this.roomMembers.get(data.roomId) || [],
      );
      client.emit('roomUsers', {
        roomId: data.roomId,
        users: currentMembers,
      });
    } else {
      // Trường hợp không có userId (giống code cũ của bạn)
      console.log(`✅ Client ${client.id} joined room-${data.roomId}`);

      // Thông báo đơn giản (không có userId)
      client.to(`room-${data.roomId}`).emit('userJoined', {
        roomId: data.roomId,
      });
    }

    return { success: true };
  }

  @SubscribeMessage('addUserToRoom')
  async handleAddUserToRoom(
    @MessageBody()
    data: { ownerId: number; roomId: number; newUserIds: number[] },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('🚀 Adding users to room:', data);

    try {
      // Thêm user mới vào room trong database
      const result = await this.chatRoomService.addedUsersToRoom(
        data.ownerId,
        data.roomId,
        data.newUserIds,
      );

      console.log('✅ Users added to database successfully');

      // Emit cho room để update member list
      this.server.to(`room-${data.roomId}`).emit('usersAdded', {
        roomId: data.roomId,
        users: result.data.members?.map((m) => m.user),
      });

      // Lấy thông tin room để gửi cho users được add
      const room = await this.chatRoomService.findRoomById(data.roomId);

      console.log(
        `📤 Notifying ${data.newUserIds.length} users about room addition`,
      );

      // Emit cho từng user được add vào room
      for (const userId of data.newUserIds) {
        const socketId = this.userSockets.get(userId);
        console.log(`Notifying user ${userId}, socket: ${socketId}`);

        if (socketId) {
          const socket = this.server.sockets.sockets.get(socketId);

          if (socket && socket.connected) {
            // Emit trực tiếp vào socket của user
            socket.emit('addedToRoom', {
              room: {
                id: room?.id,
                name: room?.name,
                description: room?.description,
                isPrivate: room?.isPrivate,
                createdAt: room?.createdAt,
                updatedAt: room?.updatedAt,
                owner: room?.owner,
                members: this.roomMembers.get(room?.id as number) ?? [],
              },
              addedBy: data.ownerId,
              timestamp: new Date().toISOString(),
            });

            console.log(
              `✅ Successfully notified user ${userId} about room ${room?.id}`,
            );
          } else {
            console.log(`❌ User ${userId} socket not connected`);
          }
        } else {
          console.log(`❌ User ${userId} not found in active sockets`);
        }

        // Cũng thử emit vào user room (backup method)
        this.server.to(`user-${userId}`).emit('addedToRoom', {
          room: {
            id: room?.id,
            name: room?.name,
            description: room?.description,
            isPrivate: room?.isPrivate,
            createdAt: room?.createdAt,
            updatedAt: room?.updatedAt,
            owner: room?.owner,
          },
          addedBy: data.ownerId,
          timestamp: new Date().toISOString(),
        });
      }

      return { success: true, message: 'Users added successfully' };
    } catch (error) {
      console.error('❌ Error adding users to room:', error);
      client.emit('error', { message: error.message });
      return { success: false, error: error.message };
    }
  }

  // WebRTC handlers
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

  // Legacy sendFile method - now using uploadFile instead
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
      type: 'file',
    });

    return { ok: true, message };
  }
}
