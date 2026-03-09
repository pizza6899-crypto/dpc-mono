import { Module } from '@nestjs/common';
import { ChatRoomsModule } from './rooms/chat-rooms.module';
import { ChatConfigModule } from './config/chat-config.module';

@Module({
    imports: [ChatRoomsModule, ChatConfigModule],
})

export class ChatModule { }
