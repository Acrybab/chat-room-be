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

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development', '.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      ...(process.env.NODE_ENV === 'production'
        ? {
            // Production - Railway
            url: process.env.MYSQL_URL,
            ssl: { rejectUnauthorized: false },
          }
        : {
            // Development - Local
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT ? +process.env.DB_PORT : 3306,
            username: process.env.DB_USERNAME || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'chatroom',
            ssl: false,
          }),
      entities: [User, ChatRoom, Message, ChatRoomMember, MessageRead],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV !== 'production',
      autoLoadEntities: true,
    }),
    CoreModule,
    ChatRoomModule,
    MessageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorsMiddleware).forRoutes('*');
  }
}
