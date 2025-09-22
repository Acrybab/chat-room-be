import { User } from 'src/core/users/entities/user.entities';
import { Message } from 'src/messages/entities/message.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class MessageRead {
  @PrimaryGeneratedColumn()
  id: number;
  @ManyToOne(() => Message, (message) => message.reads, { onDelete: 'CASCADE' })
  message: Message;

  @ManyToOne(() => User, (user) => user.readMessages, { onDelete: 'CASCADE' })
  user: User;
  @CreateDateColumn()
  readAt: Date;
}
