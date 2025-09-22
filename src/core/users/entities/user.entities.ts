import { ChatRoomMember } from 'src/chat-room-members/entities/chat-room-member-entity';
import { ChatRoom } from 'src/chat-rooms/entities/chat-room.entity';
import { MessageRead } from 'src/message-read/entities/message_read.entity';
import { Message } from 'src/messages/entities/message.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  email: string;

  @Column({ nullable: true })
  isOnline: boolean;
  @Column()
  password: string;
  @OneToMany(() => MessageRead, (read) => read.user)
  readMessages: MessageRead[];

  @OneToMany(() => Message, (message) => message.user)
  messages: Message[];
  @OneToMany(() => ChatRoomMember, (crm) => crm.user)
  chatRoomMembers: ChatRoomMember[];
  @OneToMany(() => ChatRoom, (chatRoom) => chatRoom.owner)
  ownedRooms: ChatRoom[];
}
