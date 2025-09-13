import { ChatRoomMember } from 'src/chat-room-members/entities/chat-room-member-entity';
import { Message } from 'src/messages/entities/message.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;
  @OneToMany(() => Message, (message) => message.user)
  messages: Message[];
  @OneToMany(() => ChatRoomMember, (crm) => crm.user)
  chatRoomMembers: ChatRoomMember[];
}
