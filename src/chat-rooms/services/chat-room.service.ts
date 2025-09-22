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

  async createChatRoom(userId: number, chatRoomDTO: CreateChatRoomDto) {
    const user = await this.userService.findById(userId);

    if (!user) {
      return {
        data: {
          message: 'Owner user not found',
        },
      };
    }

    const newChatRoom = this.chatRoomRepository.create({
      ...chatRoomDTO,
      isActive: true,
      owner: user,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPrivate: false, // Mặc định là false, bạn có thể thay đổi logic này nếu cần
    });
    const createdChatRoom = await this.chatRoomRepository.save(newChatRoom);

    const chatRoomMember = this.chatRoomMemberRepository.create({
      chatRoom: createdChatRoom,
      user: user,
      isAdmin: true, // Chủ phòng sẽ là admin
    });
    await this.chatRoomMemberRepository.save(chatRoomMember);

    return {
      data: {
        message: 'Chat room created successfully',
        chatRoom: createdChatRoom,
      },
    };
  }

  async getAllChatRooms(userId: number) {
    const user = await this.userService.findById(userId);
    if (!user) {
      return {
        data: {
          message: 'User not found',
        },
      };
    }

    // Lấy tất cả các phòng mà user là thành viên (bao gồm cả owner)
    const chatRoomMembers = await this.chatRoomMemberRepository.find({
      where: { user: { id: userId } },
      relations: [
        'chatRoom',
        'chatRoom.owner',
        'chatRoom.members',
        'chatRoom.members.user',
        'chatRoom.messages',
      ],
    });

    const chatRooms = chatRoomMembers.map((member) => ({
      ...member.chatRoom,
      userRole: member.isAdmin ? 'admin' : 'member', // Thêm thông tin role của user
      // joinedAt: member.createdAt || member.chatRoom.createdAt, // Thời gian Join
      category: member.chatRoom.category,
      description: member.chatRoom.description,
      memberCount: member.chatRoom.members.length,
      messageCount: member.chatRoom.messages.length,
      createdAt: member.chatRoom.createdAt,
      updatedAt: member.chatRoom.updatedAt,
      isActive: member.chatRoom.isActive,

      isPrivate: member.chatRoom.isPrivate,
      members: member.chatRoom.members.map((m) => ({
        id: m.id,
        user: {
          id: m.user.id,
          email: m.user.email,
        },
        isAdmin: m.isAdmin,
      })),
      messages: member.chatRoom.messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        user: {
          id: msg.user.id,
          email: msg.user.email,
        },
      })),
      name: member.chatRoom.name,
    }));

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

  async addedUsersToRoom(
    ownerId: number,
    roomId: number,
    newUserIds: number[],
  ) {
    const chatRoom = await this.chatRoomRepository.findOne({
      where: { id: roomId },
      relations: ['owner'],
    });
    if (!chatRoom) {
      return {
        data: {
          message: 'Chat room not found',
        },
      };
    }
    if (chatRoom.owner.id !== ownerId) {
      return {
        data: {
          message: 'Only the owner can add users to the room',
        },
      };
    }

    const addedMembers: ChatRoomMember[] = [];

    for (const userId of newUserIds) {
      const user = await this.userService.findById(userId);
      if (!user) continue;

      const existing = await this.chatRoomMemberRepository.findOne({
        where: { chatRoom: { id: roomId }, user: { id: userId } },
      });
      if (existing) continue;

      const member = this.chatRoomMemberRepository.create({
        chatRoom: chatRoom,
        user: user,
        isAdmin: false,
      });

      const savedMember = await this.chatRoomMemberRepository.save(member);
      addedMembers.push(savedMember);
    }

    return {
      data: {
        message: 'Users added successfully',
        members: addedMembers,
      },
    };
  }

  async findRoomById(id: number) {
    return this.chatRoomRepository.findOne({ where: { id } });
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
