import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entities';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.userRepository.findOneBy({ email });
  }

  findById(id: number) {
    return this.userRepository.findOneBy({ id });
  }

  async updateStatus(userId: number, isOnline: boolean) {
    await this.userRepository.update({ id: userId }, { isOnline });
    return await this.userRepository.save({ id: userId, isOnline });
  }

  async getAllUsers() {
    const users = await this.userRepository.find({
      select: ['id', 'email', 'isOnline'], // chỉ lấy field cần
    });
    return {
      data: {
        message: ' Users fetched successfully',
        users,
      },
    };
  }

  async getMembersChatRoom(roomId: number) {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.chatRoomMembers', 'crm')
      .where('crm.chatRoomId = :roomId', { roomId })
      .select(['user.id', 'user.email', 'user.isOnline'])
      .getMany();

    return {
      data: {
        message: 'Chat room members fetched successfully',
        users,
      },
    };
  }

  async getAllUserOnline() {
    const onlineUsers = await this.userRepository.find({
      where: { isOnline: true },
      select: ['id', 'email', 'isOnline'], // chỉ lấy field cần
    });

    return {
      data: {
        message: 'Online users fetched successfully',
        onlineUsers,
      },
    };
  }
}
