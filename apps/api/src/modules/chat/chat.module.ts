import { Module } from '@nestjs/common';
import { ChatRoomsModule } from './rooms/chat-rooms.module';
import { ChatConfigModule } from './config/chat-config.module';
import { ChatSupportModule } from './support/chat-support.module';

@Module({
  imports: [ChatRoomsModule, ChatConfigModule, ChatSupportModule],
})
export class ChatModule {}
