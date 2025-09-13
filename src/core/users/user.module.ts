import { Module } from '@nestjs/common';
import { AuthService } from '../auth/services/auth.services';
import { UserService } from './services/user.services';

Module({
  providers: [AuthService],
  exports: [AuthService, UserService],
});
export class UsersModule {}
