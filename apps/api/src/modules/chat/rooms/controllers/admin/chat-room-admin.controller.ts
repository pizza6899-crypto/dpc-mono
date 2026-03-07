import { Body, Controller, Get, Post, Inject, Req } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { ApiStandardResponse, ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { CreateChatRoomService } from '../../application/create-chat-room.service';
import { ListChatRoomsService } from '../../application/list-chat-rooms.service';
import { CreateChatRoomAdminRequestDto } from './dto/request/create-chat-room-admin.request.dto';
import { ChatRoomAdminResponseDto } from './dto/response/chat-room-admin.response.dto';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';

@Controller('admin/chat/rooms')
@ApiTags('Admin Chat Rooms')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiCookieAuth()
@ApiBearerAuth()
@ApiStandardErrors()
export class ChatRoomAdminController {
    constructor(
        private readonly createRoomService: CreateChatRoomService,
        private readonly listRoomService: ListChatRoomsService,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create Chat Room / 채팅방 생성' })
    @ApiStandardResponse(ChatRoomAdminResponseDto)
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'CREATE_CHAT_ROOM',
        category: 'CHAT',
        extractMetadata: (req) => ({
            params: req.body,
            result: req.__audit_after,
        }),
    })
    async create(
        @Body() dto: CreateChatRoomAdminRequestDto,
        @Req() req: any,
    ): Promise<ChatRoomAdminResponseDto> {
        const room = await this.createRoomService.execute(dto);
        const response = new ChatRoomAdminResponseDto(room);

        req.__audit_after = response;

        return response;
    }

    @Get()
    @ApiOperation({ summary: 'List All Chat Rooms / 모든 채팅방 목록 조회' })
    @ApiStandardResponse(ChatRoomAdminResponseDto, { isArray: true })
    async list(): Promise<ChatRoomAdminResponseDto[]> {
        const rooms = await this.listRoomService.execute();
        return rooms.map((room) => new ChatRoomAdminResponseDto(room));
    }
}
