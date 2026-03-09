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
import { GetMySupportInquiryService } from '../../application/get-my-support-inquiry.service';

import { StartSupportInquiryUserRequestDto } from './dto/request/start-support-inquiry-user.request.dto';
import { SendChatMessageUserRequestDto } from '../../../rooms/controllers/user/dto/request/send-chat-message-user.request.dto';
import { ChatMessageHistoryRequestDto } from '../../../rooms/controllers/user/dto/request/chat-message-history.request.dto';
import { ChatRoomUserResponseDto } from '../../../rooms/controllers/user/dto/response/chat-room-user.response.dto';
import { ChatMessageUserResponseDto } from '../../../rooms/controllers/user/dto/response/chat-message-user.response.dto';
import { ChatRoomUnauthorizedException, ChatRoomNotFoundException } from '../../../rooms/domain/chat-room.exception';
import { CHAT_ROOM_MEMBER_REPOSITORY_PORT, type ChatRoomMemberRepositoryPort } from '../../../rooms/ports/chat-room-member.repository.port';
import { Inject } from '@nestjs/common';

@Controller('chat/support')
@ApiTags('User Chat Support')
@ApiCookieAuth()
@ApiStandardErrors()
export class SupportUserController {
    constructor(
        private readonly startInquiryService: StartSupportInquiryService,
        private readonly sendSupportMessageService: SendSupportMessageService,
        private readonly getMessagesService: GetChatMessagesService,
        private readonly getMyInquiryService: GetMySupportInquiryService,
        @Inject(CHAT_ROOM_MEMBER_REPOSITORY_PORT)
        private readonly memberRepository: ChatRoomMemberRepositoryPort,
        private readonly sqidsService: SqidsService,
    ) { }

    @Get('me')
    @ApiOperation({ summary: 'Get My Support Inquiry Info / 내 상담 정보 조회' })
    @ApiStandardResponse(ChatRoomUserResponseDto)
    async getMyInquiry(
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<ChatRoomUserResponseDto> {
        const room = await this.getMyInquiryService.execute(user.id);
        if (!room) {
            throw new ChatRoomNotFoundException();
        }

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

    @Get(':roomId/messages')
    @ApiOperation({ summary: 'Get Support Chat History / 상담 채팅 내역 조회' })
    @ApiStandardResponse(ChatMessageUserResponseDto, { isArray: true })
    async listMessages(
        @CurrentUser() user: AuthenticatedUser,
        @Param('roomId') roomIdEncoded: string,
        @Query() query: ChatMessageHistoryRequestDto,
    ): Promise<ChatMessageUserResponseDto[]> {
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

    @Post('inquire')
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

    @Post(':roomId/messages')
    @ApiOperation({ summary: 'Send Support Chat Message / 상담 채팅 메시지 전송' })
    @ApiStandardResponse(ChatMessageUserResponseDto)
    async send(
        @CurrentUser() user: AuthenticatedUser,
        @Param('roomId') roomIdEncoded: string,
        @Body() body: SendChatMessageUserRequestDto,
    ): Promise<ChatMessageUserResponseDto> {
        const { id: roomId } = this.sqidsService.decodeAuto(roomIdEncoded);

        const message = await this.sendSupportMessageService.execute({
            roomId,
            senderId: user.id,
            content: body.content,
            type: body.type,
            isAdmin: false,
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

