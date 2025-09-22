import { Module } from '@nestjs/common';
import { AuthService } from '../auth/services/auth.services';
import { UserService } from './services/user.services';
import { ChatRoomService } from 'src/chat-rooms/services/chat-room.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entities';
import { ChatRoom } from 'src/chat-rooms/entities/chat-room.entity';
import { UserController } from './controllers/user.controller';
import { MailService } from 'src/common/services/mail.services';
import { ChatRoomMember } from 'src/chat-room-members/entities/chat-room-member-entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, ChatRoom, ChatRoomMember])],
  providers: [AuthService, UserService, ChatRoomService, MailService],
  exports: [AuthService, UserService],
  controllers: [UserController],
})
export class UsersModule {}
