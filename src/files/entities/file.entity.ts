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

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  filename: string;
  @Column()
  fileUrl: string;
  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => ChatRoom, { onDelete: 'CASCADE' })
  chatRoom: ChatRoom;

  @CreateDateColumn()
  uploadedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  // Define columns and relationships here
}
