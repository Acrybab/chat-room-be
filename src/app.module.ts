import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from './core/users/entities/user.entities';
import { CoreModule } from './core/core.module';
import { CorsMiddleware } from './cors.middleware';
import { ChatRoom } from './chat-rooms/entities/chat-room.entity';
import { Message } from './messages/entities/message.entity';
import { ChatRoomMember } from './chat-room-members/entities/chat-room-member-entity';
import { ChatRoomModule } from './chat-rooms/chatRoom.module';
import { MessageModule } from './messages/message.module';
import { MessageRead } from './message-read/entities/message_read.entity';
import { TwilioModule } from './chat-rooms/twilio.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development', '.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      url: process.env.DATABASE_URL, // URL Railway
      ssl: { rejectUnauthorized: false }, // bắt buộc trên Railway
      entities: [User, ChatRoom, Message, ChatRoomMember, MessageRead],
      synchronize: true, // production không sync tự động
      autoLoadEntities: true,
      logging: false,
    }),

    CoreModule,
    ChatRoomModule,
    MessageModule,
    TwilioModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorsMiddleware).forRoutes('*');
  }
}
