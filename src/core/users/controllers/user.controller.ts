import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from '../services/user.services';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get()
  async getAllUsers() {
    return await this.userService.getAllUsers();
  }

  @Get('online')
  async getAllOnlineUsers() {
    return await this.userService.getAllUserOnline();
  }

  @Get('members/:roomId')
  async getMembersChatRoom(@Param('roomId') roomId: number) {
    return await this.userService.getMembersChatRoom(roomId);
  }

  // You can add user-related endpoints here if needed
}
