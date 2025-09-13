import { Module } from '@nestjs/common';
import { MessageService } from './services/message.service';
import { UserService } from 'src/core/users/services/user.services';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { User } from 'src/core/users/entities/user.entities';
import { MessageController } from './controllers/message.controller';
import { ChatRoomService } from 'src/chat-rooms/services/chat-room.service';
import { ChatRoom } from 'src/chat-rooms/entities/chat-room.entity';
import { ChatRoomMember } from 'src/chat-room-members/entities/chat-room-member-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, User, ChatRoom, ChatRoomMember]),
  ],
  controllers: [MessageController],
  providers: [MessageService, UserService, ChatRoomService],
})
export class MessageModule {}
