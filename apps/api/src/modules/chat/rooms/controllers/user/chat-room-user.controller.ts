import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { ApiStandardResponse, ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { ListChatRoomsService } from '../../application/list-chat-rooms.service';
import { ChatRoomUserResponseDto } from './dto/response/chat-room-user.response.dto';

@Controller('chat/rooms')
@ApiTags('User Chat Rooms')
@ApiCookieAuth()
@ApiStandardErrors()
export class ChatRoomUserController {
    constructor(
        private readonly listRoomService: ListChatRoomsService,
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
}
