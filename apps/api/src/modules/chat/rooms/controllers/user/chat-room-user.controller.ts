import { Controller, Get, Post, Param, Req, Body } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { ApiStandardResponse, ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { ListChatRoomsService } from '../../application/list-chat-rooms.service';
import { SendChatMessageService } from '../../application/send-chat-message.service';
import { StartSupportInquiryService } from '../../application/start-support-inquiry.service';
import { ChatRoomUserResponseDto } from './dto/response/chat-room-user.response.dto';
import { SendChatMessageUserRequestDto } from './dto/request/send-chat-message-user.request.dto';
import { StartSupportInquiryUserRequestDto } from './dto/request/start-support-inquiry-user.request.dto';
import { ChatMessageUserResponseDto } from './dto/response/chat-message-user.response.dto';


@Controller('chat/rooms')
@ApiTags('User Chat Rooms')
@ApiCookieAuth()
@ApiStandardErrors()
export class ChatRoomUserController {
    constructor(
        private readonly listRoomService: ListChatRoomsService,
        private readonly sendMessageService: SendChatMessageService,
        private readonly startInquiryService: StartSupportInquiryService,
        private readonly sqidsService: SqidsService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'List Available Chat Rooms / 이용 가능한 채팅방 목록 조회' })
    @ApiStandardResponse(ChatRoomUserResponseDto, { isArray: true })
    async list(): Promise<ChatRoomUserResponseDto[]> {
        const rooms = await this.listRoomService.execute();

        return rooms.map((room) => ({
            id: this.sqidsService.encode(room.id, SqidsPrefix.CHAT_ROOM),
            slug: room.slug,
            type: room.type,
            metadata: room.metadata,
            slowModeSeconds: room.slowModeSeconds,
            supportStatus: room.supportStatus || undefined,
            supportPriority: room.supportPriority || undefined,
            supportCategory: room.supportCategory,
            supportSubject: room.supportSubject,
        }));
    }

    @Post('support/inquire')
    @ApiOperation({ summary: 'Start Support Inquiry / 고객 상담 문의 시작' })
    @ApiStandardResponse(ChatRoomUserResponseDto)
    async inquire(
        @CurrentUser() user: AuthenticatedUser,
        @Body() body: StartSupportInquiryUserRequestDto,
    ): Promise<ChatRoomUserResponseDto> {
        const room = await this.startInquiryService.execute({
            userId: user.id,
            category: body.category,
            subject: body.subject,
            priority: body.priority,
        });

        return {
            id: this.sqidsService.encode(room.id, SqidsPrefix.CHAT_ROOM),
            slug: room.slug,
            type: room.type,
            metadata: room.metadata,
            slowModeSeconds: room.slowModeSeconds,
            supportStatus: room.supportStatus || undefined,
            supportPriority: room.supportPriority || undefined,
            supportCategory: room.supportCategory,
            supportSubject: room.supportSubject,
        };
    }

    @Post(':id/messages')
    @ApiOperation({ summary: 'Send Chat Message / 채팅 메시지 전송' })
    @ApiStandardResponse(ChatMessageUserResponseDto)
    async send(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
        @Body() body: SendChatMessageUserRequestDto,
    ): Promise<ChatMessageUserResponseDto> {
        const { id: roomId } = this.sqidsService.decodeAuto(id);

        const message = await this.sendMessageService.execute({
            roomId,
            senderId: user.id,
            content: body.content,
            type: body.type,
        });

        return {
            id: this.sqidsService.encode(message.id, SqidsPrefix.CHAT_MESSAGE),
            roomId: this.sqidsService.encode(message.roomId, SqidsPrefix.CHAT_ROOM),
            senderId: message.senderId ? this.sqidsService.encode(message.senderId, SqidsPrefix.USER) : null,
            content: message.content,
            type: message.type,
            metadata: message.metadata,
            createdAt: message.createdAt,
        };
    }
}




