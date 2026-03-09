import { Controller, Post, Body, Param, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { ApiStandardResponse, ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { StartSupportInquiryService } from '../../application/start-support-inquiry.service';
import { SendSupportMessageService } from '../../application/send-support-message.service';
import { GetChatMessagesService } from '../../../rooms/application/get-chat-messages.service';
import { StartSupportInquiryUserRequestDto } from './dto/request/start-support-inquiry-user.request.dto';
import { SendSupportMessageUserRequestDto } from './dto/request/send-support-message-user.request.dto';
import { SupportMessageHistoryUserRequestDto } from './dto/request/support-message-history-user.request.dto';
import { MarkSupportChatReadUserRequestDto } from './dto/request/mark-support-chat-read-user.request.dto';
import { SupportInquiryUserResponseDto } from './dto/response/support-inquiry-user.response.dto';
import { SupportMessageUserResponseDto } from './dto/response/support-message-user.response.dto';
import { SendSupportMessageUserResponseDto } from './dto/response/send-support-message-user.response.dto';
import { ReadChatMessagesService } from '../../../rooms/application/read-chat-messages.service';
import { ChatRoomUnauthorizedException } from '../../../rooms/domain/chat-room.exception';
import { CHAT_ROOM_MEMBER_REPOSITORY_PORT, type ChatRoomMemberRepositoryPort } from '../../../rooms/ports/chat-room-member.repository.port';
import { Inject } from '@nestjs/common';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';

@Controller('chat/support')
@ApiTags('User Chat Support')
@ApiCookieAuth()
@ApiStandardErrors()
export class SupportUserController {
    constructor(
        private readonly startInquiryService: StartSupportInquiryService,
        private readonly sendSupportMessageService: SendSupportMessageService,
        private readonly getMessagesService: GetChatMessagesService,
        @Inject(CHAT_ROOM_MEMBER_REPOSITORY_PORT)
        private readonly memberRepository: ChatRoomMemberRepositoryPort,
        private readonly readMessagesService: ReadChatMessagesService,
        private readonly sqidsService: SqidsService,
    ) { }

    @Get(':roomId/messages')
    @ApiOperation({ summary: 'Get Support Chat History / 상담 채팅 내역 조회' })
    @ApiStandardResponse(SupportMessageUserResponseDto, { isArray: true })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'CHAT',
        action: 'VIEW_MESSAGES',
        extractMetadata: (req, args) => ({
            roomId: args[1],
        }),
    })
    async listMessages(
        @CurrentUser() user: AuthenticatedUser,
        @Param('roomId') roomIdEncoded: string,
        @Query() query: SupportMessageHistoryUserRequestDto,
    ): Promise<SupportMessageUserResponseDto[]> {
        const { id: roomId } = this.sqidsService.decodeAuto(roomIdEncoded);

        // 본인의 상담방인지 확인
        const member = await this.memberRepository.findByRoomIdAndUserId(roomId, user.id);
        if (!member) {
            throw new ChatRoomUnauthorizedException();
        }

        let lastMessageId: bigint | undefined;
        if (query.lastMessageId) {
            lastMessageId = this.sqidsService.decodeAuto(query.lastMessageId).id;
        }

        const messages = await this.getMessagesService.execute({
            roomId,
            limit: query.limit,
            lastMessageId,
        });

        // 상대방(관리자)의 마지막 읽은 메시지 ID 확인 (1:1 상담 기준)
        const members = await this.memberRepository.listByRoomId(roomId);
        const counterpart = members.find((m) => m.userId !== user.id);

        return messages.map((m) => ({
            id: this.sqidsService.encode(m.id, SqidsPrefix.CHAT_MESSAGE),
            senderId: m.senderId ? this.sqidsService.encode(m.senderId, SqidsPrefix.USER) : null,
            content: m.content,
            type: m.type,
            metadata: m.metadata,
            createdAt: m.createdAt,
            isRead: counterpart?.lastReadMessageId ? m.id <= counterpart.lastReadMessageId : false,
        }));
    }

    @Post('inquire')
    @ApiOperation({ summary: 'Start Support Inquiry / 고객 상담 문의 시작' })
    @ApiStandardResponse(SupportInquiryUserResponseDto)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'CHAT',
        action: 'START_INQUIRY',
    })
    async inquire(
        @CurrentUser() user: AuthenticatedUser,
        @Body() body: StartSupportInquiryUserRequestDto,
    ): Promise<SupportInquiryUserResponseDto> {
        const room = await this.startInquiryService.execute({
            userId: user.id,
        });

        return {
            id: this.sqidsService.encode(room.id, SqidsPrefix.CHAT_ROOM),
        };
    }

    @Post(':roomId/messages')
    @ApiOperation({ summary: 'Send Support Chat Message / 상담 채팅 메시지 전송' })
    @ApiStandardResponse(SendSupportMessageUserResponseDto)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'CHAT',
        action: 'SEND_MESSAGE',
        extractMetadata: (req, args) => ({
            roomId: args[1],
        }),
    })
    async send(
        @CurrentUser() user: AuthenticatedUser,
        @Param('roomId') roomIdEncoded: string,
        @Body() body: SendSupportMessageUserRequestDto,
    ): Promise<SendSupportMessageUserResponseDto> {
        const { id: roomId } = this.sqidsService.decodeAuto(roomIdEncoded);


        let imageIds: bigint[] | undefined;
        if (body.imageIds && body.imageIds.length > 0) {
            imageIds = body.imageIds.map(id => this.sqidsService.decodeAuto(id).id);
        }

        const message = await this.sendSupportMessageService.execute({
            roomId,
            senderId: user.id,
            content: body.content,
            isAdmin: false,
            imageIds,
        });

        return {
            id: this.sqidsService.encode(message.id, SqidsPrefix.CHAT_MESSAGE),
        };
    }

    @Post(':roomId/read')
    @ApiOperation({ summary: 'Mark Support Chat Messages as Read / 상담 채팅 메시지 읽음 처리' })
    @ApiStandardResponse(Boolean)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'CHAT',
        action: 'MARK_AS_READ',
        extractMetadata: (req, args) => ({
            roomId: args[1],
        }),
    })
    async markAsRead(
        @CurrentUser() user: AuthenticatedUser,
        @Param('roomId') roomIdEncoded: string,
        @Body() body: MarkSupportChatReadUserRequestDto,
    ): Promise<boolean> {
        const { id: roomId } = this.sqidsService.decodeAuto(roomIdEncoded);
        const { id: lastReadMessageId } = this.sqidsService.decodeAuto(body.lastReadMessageId);

        await this.readMessagesService.execute({
            roomId,
            userId: user.id,
            lastReadMessageId,
        });

        return true;
    }
}
