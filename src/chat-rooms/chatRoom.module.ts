import { Module } from '@nestjs/common';
import { ChatRoomService } from './services/chat-room.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatRoomController } from './controllers/chat-room.controller';
import { ChatRoomMember } from 'src/chat-room-members/entities/chat-room-member-entity';
import { UserService } from 'src/core/users/services/user.services';
import { User } from 'src/core/users/entities/user.entities';
import { ChatGateway } from './gateways/chatGateWay';
import { MessageService } from 'src/messages/services/message.service';
import { Message } from 'src/messages/entities/message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoom, ChatRoomMember, User, Message]),
  ],
  controllers: [ChatRoomController],
  providers: [ChatRoomService, UserService, ChatGateway, MessageService],
  exports: [ChatRoomService],
})
export class ChatRoomModule {}
