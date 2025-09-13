import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entities';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.userRepository.findOneBy({ email });
  }

  findById(id: number) {
    return this.userRepository.findOneBy({ id });
  }
}
