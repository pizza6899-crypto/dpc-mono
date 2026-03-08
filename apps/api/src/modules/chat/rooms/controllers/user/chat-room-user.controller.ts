import { Controller, Get, Post, Param, Req } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { ApiStandardResponse, ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { ListChatRoomsService } from '../../application/list-chat-rooms.service';
import { GetChatRoomService } from '../../application/get-chat-room.service';
import { JoinChatRoomService } from '../../application/join-chat-room.service';
import { LeaveChatRoomService } from '../../application/leave-chat-room.service';
import { GetMyTierService } from 'src/modules/tier/profile/application/get-my-tier.service';
import { WebsocketService } from 'src/infrastructure/websocket/websocket.service';
import { ChatRoomUserResponseDto } from './dto/response/chat-room-user.response.dto';

@Controller('chat/rooms')
@ApiTags('User Chat Rooms')
@ApiCookieAuth()
@ApiStandardErrors()
export class ChatRoomUserController {
    constructor(
        private readonly listRoomService: ListChatRoomsService,
        private readonly getRoomService: GetChatRoomService,
        private readonly joinRoomService: JoinChatRoomService,
        private readonly leaveRoomService: LeaveChatRoomService,
        private readonly getMyTierService: GetMyTierService,
        private readonly websocketService: WebsocketService,
        private readonly sqidsService: SqidsService,
    ) { }


    @Get()
    @ApiOperation({ summary: 'List Available Chat Rooms / 이용 가능한 채팅방 목록 조회' })
    @ApiStandardResponse(ChatRoomUserResponseDto, { isArray: true })
    async list(): Promise<ChatRoomUserResponseDto[]> {
        const rooms = await this.listRoomService.execute();

        return rooms.map((room) => new ChatRoomUserResponseDto({
            id: this.sqidsService.encode(room.id, SqidsPrefix.CHAT_ROOM),
            slug: room.slug,
            type: room.type,
            metadata: room.metadata,
            slowModeSeconds: room.slowModeSeconds,
        }));
    }

    @Post(':id/join')
    @ApiOperation({ summary: 'Join Chat Room / 채팅방 참여' })
    @ApiStandardResponse(ChatRoomUserResponseDto)
    async join(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
    ): Promise<ChatRoomUserResponseDto> {
        const roomIdArray = this.sqidsService.decode(id, SqidsPrefix.CHAT_ROOM);
        const roomId = roomIdArray[0];
        const userTier = await this.getMyTierService.findUserTier(BigInt(user.id));

        await this.joinRoomService.execute({
            roomId: BigInt(roomId),
            userId: BigInt(user.id),
            tierLevel: userTier.tier?.level ?? 0,
        });

        // 소켓 룸 조인 브릿지
        this.websocketService.joinChatRoom(BigInt(user.id), BigInt(roomId));

        const room = await this.getRoomService.execute({ id: BigInt(roomId) });

        return new ChatRoomUserResponseDto({
            id: this.sqidsService.encode(room.id, SqidsPrefix.CHAT_ROOM),
            slug: room.slug,
            type: room.type,
            metadata: room.metadata,
            slowModeSeconds: room.slowModeSeconds,
        });
    }

    @Post(':id/leave')
    @ApiOperation({ summary: 'Leave Chat Room / 채팅방 퇴장' })
    @ApiStandardResponse(Boolean)
    async leave(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
    ): Promise<boolean> {
        const roomIdArray = this.sqidsService.decode(id, SqidsPrefix.CHAT_ROOM);
        const roomId = roomIdArray[0];

        await this.leaveRoomService.execute({
            roomId: BigInt(roomId),
            userId: BigInt(user.id),
        });

        // 소켓 룸 리브 브릿지
        this.websocketService.leaveChatRoom(BigInt(user.id), BigInt(roomId));

        return true;
    }
}


