/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ChatRoomService } from '../services/chat-room.service';
import { CreateChatRoomDto } from '../dtos/createChatRoom.dto';
import { JwtAuthGuard } from 'src/core/auth/guards/jwt-auth.guard';

@Controller('chat-rooms')
export class ChatRoomController {
  constructor(private readonly chatRoomService: ChatRoomService) {}

  @Post()
  createChatRoom(@Body() createChatRoomDto: CreateChatRoomDto) {
    return this.chatRoomService.createChatRoom(createChatRoomDto);
  }

  @Get()
  getAllChatRooms() {
    return this.chatRoomService.getAllChatRooms();
  }
  @Delete(':chatRoomId')
  deleteChatRoom(@Param('chatRoomId') chatRoomId: number) {
    return this.chatRoomService.deleteChatRoom(chatRoomId);
  }
  @Get(':chatRoomId')
  getChatRoomById(@Param('chatRoomId') chatRoomId: number) {
    return this.chatRoomService.getChatRoomById(chatRoomId);
  }

  @Post(':chatRoomId/join')
  @UseGuards(JwtAuthGuard)
  joinChatRoom(@Param('chatRoomId') chatRoomId: number, @Request() request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = request.user.sub;
    return this.chatRoomService.joinChatRoom(userId, chatRoomId);
  }
}
