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

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
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
    AuthService,
    MailService,
    GoogleStrategy,
    UserService,
    JwtStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
