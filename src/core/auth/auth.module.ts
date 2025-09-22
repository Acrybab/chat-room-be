import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './services/auth.services';
import { MailService } from 'src/common/services/mail.services';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entities';
import { UsersModule } from '../users/user.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './controllers/auth.controller';
import { CommonModule } from 'src/common/common.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { UserService } from '../users/services/user.services';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ChatRoomService } from 'src/chat-rooms/services/chat-room.service';
import { ChatRoom } from 'src/chat-rooms/entities/chat-room.entity';
import { ChatRoomMember } from 'src/chat-room-members/entities/chat-room-member-entity';
import { MessageService } from 'src/messages/services/message.service';
import { Message } from 'src/messages/entities/message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ChatRoom, ChatRoomMember, Message]),
    forwardRef(() => UsersModule),
    JwtModule.register({
      global: true,
      secret: 'secretKey',
      signOptions: { expiresIn: '1d' },
    }),
    CommonModule,
  ],
  controllers: [AuthController],
  providers: [
    MessageService,
    ChatRoomService,
    AuthService,
    MailService,
    GoogleStrategy,
    UserService,
    JwtStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
