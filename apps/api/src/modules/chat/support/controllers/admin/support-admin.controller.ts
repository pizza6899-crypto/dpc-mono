import { Controller, Post, Body, Param, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { ApiStandardResponse, ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { SendSupportMessageService } from '../../application/send-support-message.service';
import { ListSupportInquiriesService } from '../../application/list-support-inquiries.service';
import { GetChatMessagesService } from '../../../rooms/application/get-chat-messages.service';
import { ListSupportInquiriesAdminRequestDto } from './dto/request/list-support-inquiries-admin.request.dto';
import { ChatRoomAdminResponseDto } from '../../../rooms/controllers/admin/dto/response/chat-room-admin.response.dto';
import { SendChatMessageUserRequestDto } from '../../../rooms/controllers/user/dto/request/send-chat-message-user.request.dto';
import { ChatMessageHistoryRequestDto } from '../../../rooms/controllers/user/dto/request/chat-message-history.request.dto';
import { ChatMessageUserResponseDto } from '../../../rooms/controllers/user/dto/response/chat-message-user.response.dto';
import { ChatRoom } from '../../../rooms/domain/chat-room.entity';

@Controller('admin/chat/support')
@ApiTags('Admin Chat Support')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiCookieAuth()
@ApiBearerAuth()
@ApiStandardErrors()
export class SupportAdminController {
    constructor(
        private readonly sendSupportMessageService: SendSupportMessageService,
        private readonly listInquiriesService: ListSupportInquiriesService,
        private readonly getMessagesService: GetChatMessagesService,
        private readonly sqidsService: SqidsService,
    ) { }

    @Get('rooms')
    @ApiOperation({ summary: 'List Support Inquiries (Admin) / 상담 목록 조회 (관리자)' })
    @ApiStandardResponse(ChatRoomAdminResponseDto, { isArray: true })
    async list(
        @Query() query: ListSupportInquiriesAdminRequestDto,
    ): Promise<ChatRoomAdminResponseDto[]> {
        const rooms = await this.listInquiriesService.execute({
            status: query.status,
            priority: query.priority,
            category: query.category,
            adminId: query.adminId ? this.sqidsService.decodeAuto(query.adminId).id : undefined,
        });

        return rooms.map((room) => this.mapToResponse(room));
    }

    private mapToResponse(room: ChatRoom): ChatRoomAdminResponseDto {
        return {
            id: this.sqidsService.encode(room.id, SqidsPrefix.CHAT_ROOM),
            slug: room.slug,
            type: room.type,
            isActive: room.isActive,
            metadata: room.metadata,
            slowModeSeconds: room.slowModeSeconds,
            minTierLevel: room.minTierLevel,
            createdAt: room.createdAt,
            updatedAt: room.updatedAt,
            lastMessageAt: room.lastMessageAt,
            supportStatus: room.supportStatus || undefined,
            supportPriority: room.supportPriority || undefined,
            supportCategory: room.supportCategory,
            supportSubject: room.supportSubject,
            supportAdminId: room.supportAdminId ? this.sqidsService.encode(room.supportAdminId, SqidsPrefix.USER) : null,
        };
    }


    @Get('rooms/:roomId/messages')
    @ApiOperation({ summary: 'Get Support Chat History (Admin) / 상담 채팅 내역 조회 (관리자)' })
    @ApiStandardResponse(ChatMessageUserResponseDto, { isArray: true })
    async listMessages(
        @Param('roomId') roomIdEncoded: string,
        @Query() query: ChatMessageHistoryRequestDto,
    ): Promise<ChatMessageUserResponseDto[]> {
        const { id: roomId } = this.sqidsService.decodeAuto(roomIdEncoded);

        let lastMessageId: bigint | undefined;
        if (query.lastMessageId) {
            lastMessageId = this.sqidsService.decodeAuto(query.lastMessageId).id;
        }

        const messages = await this.getMessagesService.execute({
            roomId,
            limit: query.limit,
            lastMessageId,
        });

        return messages.map((m) => ({
            id: this.sqidsService.encode(m.id, SqidsPrefix.CHAT_MESSAGE),
            roomId: this.sqidsService.encode(m.roomId, SqidsPrefix.CHAT_ROOM),
            senderId: m.senderId ? this.sqidsService.encode(m.senderId, SqidsPrefix.USER) : null,
            content: m.content,
            type: m.type,
            metadata: m.metadata,
            createdAt: m.createdAt,
        }));
    }

    @Post('rooms/:roomId/messages')
    @ApiOperation({ summary: 'Send Support Reply (Admin) / 상담 답장 전송 (관리자)' })
    @ApiStandardResponse(ChatMessageUserResponseDto)
    async sendReply(
        @CurrentUser() admin: AuthenticatedUser,
        @Param('roomId') roomIdEncoded: string,
        @Body() body: SendChatMessageUserRequestDto,
    ): Promise<ChatMessageUserResponseDto> {
        const { id: roomId } = this.sqidsService.decodeAuto(roomIdEncoded);

        const message = await this.sendSupportMessageService.execute({
            roomId,
            senderId: admin.id,
            content: body.content,
            type: body.type,
            isAdmin: true,
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
