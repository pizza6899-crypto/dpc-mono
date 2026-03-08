import { Module } from '@nestjs/common';
import { CHAT_ROOM_REPOSITORY_PORT } from './ports/chat-room.repository.port';
import { ChatRoomRepository } from './infrastructure/chat-room.repository';
import { CHAT_ROOM_MEMBER_REPOSITORY_PORT } from './ports/chat-room-member.repository.port';
import { ChatRoomMemberRepository } from './infrastructure/chat-room-member.repository';
import { GetChatRoomService } from './application/get-chat-room.service';
import { ListChatRoomsService } from './application/list-chat-rooms.service';
import { JoinChatRoomService } from './application/join-chat-room.service';
import { LeaveChatRoomService } from './application/leave-chat-room.service';
import { ChatRoomAdminController } from './controllers/admin/chat-room-admin.controller';


import { ChatRoomUserController } from './controllers/user/chat-room-user.controller';
import { SqidsModule } from 'src/common/sqids/sqids.module';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { TierModule } from '../../tier/tier.module';


@Module({
    imports: [
        SqidsModule,
        ConcurrencyModule,
        TierModule,
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
        GetChatRoomService,
        ListChatRoomsService,
        JoinChatRoomService,
        LeaveChatRoomService,
    ],
    exports: [
        GetChatRoomService,
        ListChatRoomsService,
        JoinChatRoomService,
        LeaveChatRoomService,
        CHAT_ROOM_REPOSITORY_PORT,
        CHAT_ROOM_MEMBER_REPOSITORY_PORT,
    ],
})


export class ChatRoomsModule { }
