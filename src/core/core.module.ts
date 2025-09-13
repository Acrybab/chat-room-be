import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/user.module';

@Module({
  imports: [forwardRef(() => AuthModule), forwardRef(() => UsersModule)],
})
export class CoreModule {}
