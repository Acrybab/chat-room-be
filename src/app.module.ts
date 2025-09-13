import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './core/users/entities/user.entities';
// import { AuthModule } from './core/auth/auth.module';
import { CoreModule } from './core/core.module';
import { CorsMiddleware } from './cors.middleware';
import { ChatRoom } from './chat-rooms/entities/chat-room.entity';
import { Message } from './messages/entities/message.entity';
import { ChatRoomMember } from './chat-room-members/entities/chat-room-member-entity';
import { ChatRoomModule } from './chat-rooms/chatRoom.module';
import { MessageModule } from './messages/message.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? +process.env.DB_PORT : 3306,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, ChatRoom, Message, ChatRoomMember],
      synchronize: true,
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
