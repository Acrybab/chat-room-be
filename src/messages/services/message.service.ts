import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from '../entities/message.entity';
import { Repository } from 'typeorm';
import { UserService } from 'src/core/users/services/user.services';
import { ChatRoom } from 'src/chat-rooms/entities/chat-room.entity';
import { MessageRead } from 'src/message-read/entities/message_read.entity';
@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private readonly userService: UserService, // Giả sử bạn có UserService để lấy thông tin user
    // private readonly chatRoomService: ChatRoomService, // Nếu bạn cần liên kết với phòng chat
    @InjectRepository(ChatRoom)
    private chatRoomRepo: Repository<ChatRoom>,
  ) {}

  async createMessage(content: string, userId: number, roomId: number) {
    const user = await this.userService.findById(userId);
    const room = await this.chatRoomRepo.findOne({ where: { id: roomId } });
    if (!user) {
      throw new Error('User not found');
    }
    if (!room) {
      throw new Error('Chat room not found');
    }

    const message = this.messageRepository.create({
      content,
      chatRoom: room,
      user,
      isOwn: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.messageRepository.save(message);
  }

  async getMessagesByRoom(roomId: number) {
    const messages = await this.messageRepository.find({
      where: { chatRoom: { id: roomId } },
      relations: ['user', 'chatRoom'],
      order: { createdAt: 'ASC' },
    });
    return {
      data: {
        message: 'Messages retrieved successfully',
        messages,
      },
    };
  }
  async createFileMessage(fileUrl: string, userId: number, roomId: number) {
    const user = await this.userService.findById(userId);
    const room = await this.chatRoomRepo.findOne({ where: { id: roomId } });

    if (!user) throw new Error('User not found');
    if (!room) throw new Error('Chat room not found');

    const message = this.messageRepository.create({
      fileUrl: fileUrl,
      user,
      chatRoom: room,
      isOwn: true,
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.messageRepository.save(message);
  }
  async markAsRead(messageId: number, userId: number) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['reads'],
    });
    if (!message) throw new Error('Message not found');

    // Kiểm tra đã tồn tại chưa
    const alreadyRead = message.reads?.some((r) => r.user.id === userId);
    if (alreadyRead) return;

    const read = this.messageRepository.manager.create(MessageRead, {
      message: { id: messageId },
      user: { id: userId },
    });

    await this.messageRepository.manager.save(read);
    return read;
  }
}
