import { Module } from '@nestjs/common';
import { ChatRoomsModule } from './rooms/chat-rooms.module';
import { ChatSupportModule } from './support/chat-support.module';
import { ChatConfigModule } from './config/chat-config.module';

@Module({
    imports: [ChatRoomsModule, ChatSupportModule, ChatConfigModule],
})
export class ChatModule { }
