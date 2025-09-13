import { Injectable } from '@nestjs/common';
import { User } from 'src/core/users/entities/user.entities';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/common/services/mail.services';
import { SignInDto, SignUpDto } from '../dtos/signUp.dto';
import { hashPassword, isTheSamePassword } from 'src/common/utils/bcrypt';
import { htmlContent } from 'src/common/utils/htmlContent';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: signUpDto.email },
    });
    if (existingUser) {
      throw new Error('Email already exists');
    }
    const { email, password } = signUpDto;

    const hashedPassword = await hashPassword(password);

    const newUser = this.userRepository.create({
      email,
      password: hashedPassword,
    });
    await this.userRepository.save(newUser);

    // Send welcome email
    await this.mailService.sendHTMLEmail({
      to: email,
      subject: 'Welcome to Chat Room!',
      htmlContent: htmlContent(email),
    });

    const verifyEmailToken = await this.jwtService.signAsync({
      sub: newUser.id,
      email: newUser.email,
    });

    return {
      data: {
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
        },
        accessToken: verifyEmailToken,
      },
    };
  }

  async handleSignInWithEmailAndPassword(signInDto: SignInDto) {
    const { email, password } = signInDto;
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new Error('Invalid email or password');
    }
    const isValidPassword = await isTheSamePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }
    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      data: {
        message: 'User signed in successfully',
        user: {
          id: user.id,
          email: user.email,
        },
        accessToken,
      },
    };
  }

  async handleSignUpWithGoogle(signUpDto: SignUpDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: signUpDto.email },
    });
    if (existingUser) {
      return existingUser;
    }
    const { email, password } = signUpDto;

    const hashedPassword = await hashPassword(password);

    const newUser = this.userRepository.create({
      email,
      password: hashedPassword,
    });
    const createdUser = await this.userRepository.save(newUser);
    return createdUser;
  }

  async handleSignInWithUserId(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);
    await this.userRepository.save(user);
    return {
      data: {
        message: 'User signed in successfully',
        user: {
          id: user.id,
          email: user.email,
        },
        accessToken,
      },
    };
  }

  async getMe(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    return {
      data: {
        user: {
          id: user.id,
          email: user.email,
        },
      },
    };
  }
}
