import { Module } from '@nestjs/common';
import { CHAT_ROOM_REPOSITORY_PORT } from './ports/chat-room.repository.port';
import { ChatRoomRepository } from './infrastructure/chat-room.repository';
import { CHAT_ROOM_MEMBER_REPOSITORY_PORT } from './ports/chat-room-member.repository.port';
import { ChatRoomMemberRepository } from './infrastructure/chat-room-member.repository';
import { CreateChatRoomService } from './application/create-chat-room.service';
import { GetChatRoomService } from './application/get-chat-room.service';
import { ListChatRoomsService } from './application/list-chat-rooms.service';
import { ChatRoomAdminController } from './controllers/admin/chat-room-admin.controller';
import { ChatRoomUserController } from './controllers/user/chat-room-user.controller';
import { SqidsModule } from 'src/common/sqids/sqids.module';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';

@Module({
    imports: [
        SqidsModule,
        ConcurrencyModule,
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
        CreateChatRoomService,
        GetChatRoomService,
        ListChatRoomsService,
    ],
    exports: [
        GetChatRoomService,
        ListChatRoomsService,
        CHAT_ROOM_REPOSITORY_PORT,
        CHAT_ROOM_MEMBER_REPOSITORY_PORT,
    ],
})
export class ChatRoomsModule { }
