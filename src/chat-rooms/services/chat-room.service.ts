import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoom } from '../entities/chat-room.entity';
import { Repository } from 'typeorm';
import { CreateChatRoomDto } from '../dtos/createChatRoom.dto';
import { ChatRoomMember } from 'src/chat-room-members/entities/chat-room-member-entity';
import { UserService } from 'src/core/users/services/user.services';

@Injectable()
export class ChatRoomService {
  constructor(
    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatRoomMember)
    private chatRoomMemberRepository: Repository<ChatRoomMember>,
    private readonly userService: UserService, // Giả sử bạn có UserService để lấy thông tin user
  ) {}

  async createChatRoom(chatRoomDTO: CreateChatRoomDto) {
    const newChatRoom = this.chatRoomRepository.create({
      ...chatRoomDTO,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPrivate: false, // Mặc định là false, bạn có thể thay đổi logic này nếu cần
    });
    const createdChatRoom = await this.chatRoomRepository.save(newChatRoom);
    return {
      data: {
        message: 'Chat room created successfully',
        chatRoom: createdChatRoom,
      },
    };
  }

  async getAllChatRooms() {
    const chatRooms = await this.chatRoomRepository.find({
      relations: ['messages', 'members', 'members.user'], // 👈 load thêm user
    });
    return {
      data: {
        message: 'Chat rooms retrieved successfully',
        chatRooms,
      },
    };
  }

  async getChatRoomById(id: number) {
    const chatRoom = await this.chatRoomRepository.findOne({
      where: { id },
      relations: ['messages', 'members', 'members.user'],
    });
    return {
      data: {
        message: 'Chat room retrieved successfully',
        chatRoom,
      },
    };
  }
  async deleteChatRoom(id: number) {
    await this.chatRoomRepository.delete(id);
    return {
      data: {
        message: 'Chat room deleted successfully',
      },
    };
  }

  async joinChatRoom(userId: number, chatRoomId: number) {
    const room = await this.chatRoomRepository.findOne({
      where: { id: chatRoomId },
      relations: ['members', 'members.user'],
    });
    if (!room) {
      return {
        data: {
          message: 'Chat room not found',
        },
      };
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      return {
        data: {
          message: 'User not found',
        },
      };
    }
    const joinedMember = room.members.find(
      (member) => member.user.id === userId,
    );
    if (joinedMember) {
      return {
        data: {
          message: 'User already joined this chat room',
          chatRoomMember: joinedMember,
        },
      };
    }
    const member = this.chatRoomMemberRepository.create({
      chatRoom: room,
      user: user,
    });

    const savedMember = await this.chatRoomMemberRepository.save(member);
    return {
      data: {
        message: 'User joined chat room successfully',
        chatRoomMember: savedMember,
      },
    };
  }
}
