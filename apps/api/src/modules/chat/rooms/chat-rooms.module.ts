import { Module } from '@nestjs/common';
import { GetChatRoomService } from './application/get-chat-room.service';
import { ListChatRoomsService } from './application/list-chat-rooms.service';
import { CHAT_ROOM_REPOSITORY_PORT } from './ports/chat-room.repository.port';
import { ChatRoomRepository } from './infrastructure/chat-room.repository';
import { CHAT_ROOM_MEMBER_REPOSITORY_PORT } from './ports/chat-room-member.repository.port';
import { ChatRoomMemberRepository } from './infrastructure/chat-room-member.repository';
import { CHAT_MESSAGE_REPOSITORY_PORT } from './ports/chat-message.repository.port';
import { ChatMessageRepository } from './infrastructure/chat-message.repository';
import { ChatRoomAdminController } from './controllers/admin/chat-room-admin.controller';
import { ChatRoomUserController } from './controllers/user/chat-room-user.controller';
import { SqidsModule } from 'src/common/sqids/sqids.module';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { TierModule } from '../../tier/tier.module';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { SendChatMessageService } from './application/send-chat-message.service';
import { GetChatMessagesService } from './application/get-chat-messages.service';

@Module({
    imports: [
        SqidsModule,
        ConcurrencyModule,
        TierModule,
        SnowflakeModule,
    ],


    controllers: [
        ChatRoomAdminController,
        ChatRoomUserController,
    ],
    providers: [
        {
            provide: CHAT_ROOM_REPOSITORY_PORT,
            useClass: ChatRoomRepository,
        },
        {
            provide: CHAT_ROOM_MEMBER_REPOSITORY_PORT,
            useClass: ChatRoomMemberRepository,
        },
        {
            provide: CHAT_MESSAGE_REPOSITORY_PORT,
            useClass: ChatMessageRepository,
        },
        GetChatRoomService,
        ListChatRoomsService,
        SendChatMessageService,
        GetChatMessagesService,
    ],


    exports: [
        GetChatRoomService,
        ListChatRoomsService,
        SendChatMessageService,
        GetChatMessagesService,
        CHAT_ROOM_REPOSITORY_PORT,

        CHAT_ROOM_MEMBER_REPOSITORY_PORT,
        CHAT_MESSAGE_REPOSITORY_PORT,
    ],
})

export class ChatRoomsModule { }
