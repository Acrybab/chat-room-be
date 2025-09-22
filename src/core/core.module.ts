import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/user.module';
import { UserController } from './users/controllers/user.controller';

@Module({
  imports: [forwardRef(() => AuthModule), forwardRef(() => UsersModule)],
  controllers: [UserController],
})
export class CoreModule {}
