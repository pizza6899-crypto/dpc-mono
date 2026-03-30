import { Module } from '@nestjs/common';
import { ChatRoomsModule } from '../rooms/chat-rooms.module';
import { SnowflakeModule } from 'src/infrastructure/snowflake/snowflake.module';

@Module({
  imports: [
    ChatRoomsModule, // Repository(ChatRoom, ChatMessage) 재사용을 위해 import
    SnowflakeModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class ChatLoungeModule {}
