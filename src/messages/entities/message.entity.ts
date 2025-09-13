import { ChatRoom } from 'src/chat-rooms/entities/chat-room.entity';
import { User } from 'src/core/users/entities/user.entities';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  isOwn: boolean;
  @Column()
  content: string;
  @Column({ nullable: true })
  fileUrl: string;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.messages, { eager: true })
  user: User;
  @ManyToOne(() => ChatRoom, (chatRoom) => chatRoom.messages, {
    onDelete: 'CASCADE',
  })
  chatRoom: ChatRoom;
  // Define other columns and relationships here
}
