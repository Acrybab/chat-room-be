import { ChatRoom } from 'src/chat-rooms/entities/chat-room.entity';
import { User } from 'src/core/users/entities/user.entities';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('chat_room_members')
export class ChatRoomMember {
  @PrimaryGeneratedColumn()
  id: number;
  @ManyToOne(() => ChatRoom, (chatRoom) => chatRoom.members, {
    onDelete: 'CASCADE',
  })
  chatRoom: ChatRoom;
  @Column({ nullable: true })
  isAdmin: boolean;
  @ManyToOne(() => User, (user) => user.chatRoomMembers, {
    onDelete: 'CASCADE',
  })
  user: User;
}
