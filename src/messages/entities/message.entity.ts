import { ChatRoom } from 'src/chat-rooms/entities/chat-room.entity';
import { User } from 'src/core/users/entities/user.entities';
import { MessageRead } from 'src/message-read/entities/message_read.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  isOwn: boolean;
  @Column({ nullable: true })
  type: string;
  @Column()
  content: string;
  @Column({ nullable: true })
  fileUrl: string;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @OneToMany(() => MessageRead, (read) => read.message)
  reads: MessageRead[];

  @ManyToOne(() => User, (user) => user.messages, { eager: true })
  user: User;
  @ManyToOne(() => ChatRoom, (chatRoom) => chatRoom.messages, {
    onDelete: 'CASCADE',
  })
  chatRoom: ChatRoom;
  // Define other columns and relationships here
}
