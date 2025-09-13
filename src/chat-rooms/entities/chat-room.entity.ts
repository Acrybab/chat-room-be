import { ChatRoomMember } from 'src/chat-room-members/entities/chat-room-member-entity';
import { Message } from 'src/messages/entities/message.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('chat_rooms')
export class ChatRoom {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
  @Column()
  isPrivate: boolean;
  @Column()
  category: string;
  @Column({ nullable: true })
  description: string;
  @Column()
  isActive: boolean;
  @Column()
  createdAt: Date;
  @Column()
  updatedAt: Date;
  @OneToMany(() => Message, (message) => message.chatRoom)
  messages: Message[];

  @OneToMany(() => ChatRoomMember, (crm) => crm.chatRoom)
  members: ChatRoomMember[];
}
