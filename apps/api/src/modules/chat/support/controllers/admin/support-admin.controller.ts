import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Query,
  Inject,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { UserRoleType, ChatRoomType } from '@prisma/client';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from 'src/common/http/decorators/api-response.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { SendSupportMessageService } from '../../application/send-support-message.service';
import { ListSupportInquiriesService } from '../../application/list-support-inquiries.service';
import { UpdateSupportInquiryService } from '../../application/update-support-inquiry.service';
import { CloseSupportInquiryService } from '../../application/close-support-inquiry.service';
import { AssignSupportInquiryService } from '../../application/assign-support-inquiry.service';
import { PendingSupportInquiryService } from '../../application/pending-support-inquiry.service';
import { GetChatMessagesService } from '../../../rooms/application/get-chat-messages.service';
import { SqidsService } from 'src/infrastructure/sqids/sqids.service';
import { SqidsPrefix } from 'src/infrastructure/sqids/sqids.constants';
import { ListSupportInquiriesAdminRequestDto } from './dto/request/list-support-inquiries-admin.request.dto';
import { SupportInquiryAdminResponseDto } from './dto/response/support-inquiry-admin.response.dto';
import { UpdateSupportInquiryAdminRequestDto } from './dto/request/update-support-inquiry-admin.request.dto';
import { UpdateSupportInquiryAdminResponseDto } from './dto/response/update-support-inquiry-admin.response.dto';
import { SendSupportMessageAdminRequestDto } from './dto/request/send-support-message-admin.request.dto';
import { SendSupportMessageAdminResponseDto } from './dto/response/send-support-message-admin.response.dto';
import { SupportMessageHistoryAdminRequestDto } from './dto/request/support-message-history-admin.request.dto';
import { SupportMessageAdminResponseDto } from './dto/response/support-message-admin.response.dto';
import { SupportInquirySummary } from '../../domain/support-inquiry-summary';
import { ReadChatMessagesService } from '../../../rooms/application/read-chat-messages.service';
import {
  CHAT_ROOM_MEMBER_REPOSITORY_PORT,
  type ChatRoomMemberRepositoryPort,
} from '../../../rooms/ports/chat-room-member.repository.port';
import { MarkSupportChatReadAdminRequestDto } from './dto/request/mark-support-chat-read-admin.request.dto';
import { UpdateSupportMessageAdminRequestDto } from './dto/request/update-support-message-admin.request.dto';
import { UpdateChatMessageService } from '../../../rooms/application/update-chat-message.service';
import { DeleteChatMessageService } from '../../../rooms/application/delete-chat-message.service';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { Patch, Delete, HttpCode, HttpStatus } from '@nestjs/common';

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
    private readonly updateInquiryService: UpdateSupportInquiryService,
    private readonly closeInquiryService: CloseSupportInquiryService,
    private readonly assignInquiryService: AssignSupportInquiryService,
    private readonly pendingInquiryService: PendingSupportInquiryService,
    private readonly getMessagesService: GetChatMessagesService,
    @Inject(CHAT_ROOM_MEMBER_REPOSITORY_PORT)
    private readonly memberRepository: ChatRoomMemberRepositoryPort,
    private readonly readMessagesService: ReadChatMessagesService,
    private readonly updateMessageService: UpdateChatMessageService,
    private readonly deleteMessageService: DeleteChatMessageService,
    private readonly sqidsService: SqidsService,
  ) {}

  private parseId(id: string): bigint {
    if (/^\d+$/.test(id)) {
      return BigInt(id);
    }
    return this.sqidsService.decodeAuto(id).id;
  }

  @Get('rooms')
  @ApiOperation({
    summary: 'List Support Inquiries (Admin) / 상담 목록 조회 (관리자)',
    description:
      'Retrieve a list of support inquiries with filtering options. / 필터링 옵션과 함께 상담 문의 목록을 조회합니다.',
  })
  @ApiStandardResponse(SupportInquiryAdminResponseDto, { isArray: true })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ADMIN',
    action: 'LIST_SUPPORT_INQUIRIES',
    extractMetadata: (req, args) => ({
      ...args[0],
    }),
  })
  async list(
    @CurrentUser() admin: AuthenticatedUser,
    @Query() query: ListSupportInquiriesAdminRequestDto,
  ): Promise<SupportInquiryAdminResponseDto[]> {
    const rooms = await this.listInquiriesService.execute({
      status: query.status,
      priority: query.priority,
      category: query.category,
      adminId: query.adminId ? this.parseId(query.adminId) : undefined,
      roomId: query.roomId ? this.parseId(query.roomId) : undefined,
      currentAdminId: admin.id,
    });

    return rooms.map((room) => this.mapToResponse(room));
  }

  @Patch('rooms/:roomId')
  @ApiOperation({
    summary:
      'Update Support Inquiry Attributes (Admin) / 상담 속성 수정 (관리자)',
    description:
      'Update status, priority, or category of a support inquiry. / 상담 문의의 상태, 우선순위 또는 카테고리를 수정합니다.',
  })
  @ApiStandardResponse(UpdateSupportInquiryAdminResponseDto)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ADMIN',
    action: 'UPDATE_SUPPORT_INQUIRY',
    extractMetadata: (req, args) => ({
      roomId: args[1],
      ...args[2],
    }),
  })
  async updateRoom(
    @Param('roomId') roomIdRaw: string,
    @Body() body: UpdateSupportInquiryAdminRequestDto,
  ): Promise<UpdateSupportInquiryAdminResponseDto> {
    const roomId = this.parseId(roomIdRaw);

    const room = await this.updateInquiryService.execute({
      roomId,
      status: body.status,
      priority: body.priority,
      category: body.category,
    });

    return {
      id: room.id.toString(),
      sid: this.sqidsService.encode(room.id, SqidsPrefix.SUPPORT_ROOM),
      status: room.supportInfo!.status,
      priority: room.supportInfo!.priority,
      category: room.supportInfo!.category,
      updatedAt: room.updatedAt,
    };
  }

  @Post('rooms/:roomId/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Close Support Inquiry (Admin) / 상담 종료 (관리자)',
    description:
      'Mark a support inquiry as closed. / 상담 문의를 종료 상태로 변경합니다.',
  })
  @ApiStandardResponse(UpdateSupportInquiryAdminResponseDto)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ADMIN',
    action: 'CLOSE_SUPPORT_INQUIRY',
    extractMetadata: (req, args) => ({
      roomId: args[0],
    }),
  })
  async close(
    @Param('roomId') roomIdRaw: string,
  ): Promise<UpdateSupportInquiryAdminResponseDto> {
    const roomId = this.parseId(roomIdRaw);
    const room = await this.closeInquiryService.execute({ roomId });

    return {
      id: room.id.toString(),
      sid: this.sqidsService.encode(room.id, SqidsPrefix.SUPPORT_ROOM),
      status: room.supportInfo!.status,
      priority: room.supportInfo!.priority,
      category: room.supportInfo!.category,
      updatedAt: room.updatedAt,
    };
  }

  @Post('rooms/:roomId/pending')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pending Support Inquiry (Admin) / 상담 보류 (관리자)',
    description:
      'Mark a support inquiry as pending. / 상담 문의를 보류 상태로 변경합니다.',
  })
  @ApiStandardResponse(UpdateSupportInquiryAdminResponseDto)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ADMIN',
    action: 'PENDING_SUPPORT_INQUIRY',
    extractMetadata: (req, args) => ({
      roomId: args[0],
    }),
  })
  async pending(
    @Param('roomId') roomIdRaw: string,
  ): Promise<UpdateSupportInquiryAdminResponseDto> {
    const roomId = this.parseId(roomIdRaw);
    const room = await this.pendingInquiryService.execute({ roomId });

    return {
      id: room.id.toString(),
      sid: this.sqidsService.encode(room.id, SqidsPrefix.SUPPORT_ROOM),
      status: room.supportInfo!.status,
      priority: room.supportInfo!.priority,
      category: room.supportInfo!.category,
      updatedAt: room.updatedAt,
    };
  }

  @Post('rooms/:roomId/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Assign Admin to Support Inquiry (Admin) / 상담사 지정/가져오기 (관리자)',
    description:
      'Assign a specific administrator to the support inquiry. If "adminId" is not provided in the request body, the current logged-in administrator will be assigned. / 상담 문의에 담당 상담사를 배정합니다. 요청 바디에 "adminId"를 전달하지 않으면 현재 로그인한 관리자 본인에게 배정됩니다.',
  })
  @ApiStandardResponse(UpdateSupportInquiryAdminResponseDto)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ADMIN',
    action: 'ASSIGN_SUPPORT_INQUIRY',
    extractMetadata: (req, args) => ({
      roomId: args[1],
      adminId: args[2],
    }),
  })
  async assign(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('roomId') roomIdRaw: string,
    @Body('adminId') targetAdminIdEncoded?: string,
  ): Promise<UpdateSupportInquiryAdminResponseDto> {
    const roomId = this.parseId(roomIdRaw);
    const adminId = targetAdminIdEncoded
      ? this.parseId(targetAdminIdEncoded)
      : admin.id;

    const room = await this.assignInquiryService.execute({ roomId, adminId });

    return {
      id: room.id.toString(),
      sid: this.sqidsService.encode(room.id, SqidsPrefix.SUPPORT_ROOM),
      status: room.supportInfo!.status,
      priority: room.supportInfo!.priority,
      category: room.supportInfo!.category,
      updatedAt: room.updatedAt,
    };
  }

  private mapToResponse(
    room: SupportInquirySummary,
  ): SupportInquiryAdminResponseDto {
    return {
      id: room.roomId.toString(),
      sid: this.sqidsService.encode(room.roomId, SqidsPrefix.SUPPORT_ROOM),
      isActive: room.isActive,
      metadata: room.metadata,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      lastMessageAt: room.lastMessageAt,
      supportStatus: room.status,
      supportPriority: room.priority,
      supportCategory: room.category,
      supportSubject: room.subject,
      supportAdminId: room.adminId?.toString() || null,
      userNickname: room.userNickname,
      userLoginId: room.userLoginId,
      userAvatarUrl: room.userAvatarUrl,
      lastMessageContent: room.lastMessageContent,
      unreadCount: room.unreadCount,
    };
  }

  @Get('rooms/:roomId/messages')
  @ApiOperation({
    summary: 'Get Support Chat History (Admin) / 상담 채팅 내역 조회 (관리자)',
    description:
      'Retrieve chat message history for a specific support room. / 특정 상담방의 채팅 메시지 내역을 조회합니다.',
  })
  @ApiStandardResponse(SupportMessageAdminResponseDto, { isArray: true })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ADMIN',
    action: 'VIEW_SUPPORT_MESSAGES',
    extractMetadata: (req, args) => ({
      roomId: args[1],
    }),
  })
  async listMessages(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('roomId') roomIdRaw: string,
    @Query() query: SupportMessageHistoryAdminRequestDto,
  ): Promise<SupportMessageAdminResponseDto[]> {
    const roomId = this.parseId(roomIdRaw);

    let lastMessageId: bigint | undefined;
    if (query.lastMessageId) {
      lastMessageId = BigInt(query.lastMessageId);
    }

    const messages = await this.getMessagesService.execute({
      roomId,
      limit: query.limit,
      lastMessageId,
    });

    // 상대방(사용자)의 마지막 읽은 메시지 ID 확인 (1:1 상담 기준)
    const members = await this.memberRepository.listByRoomId(roomId);
    const counterpart = members.find((m) => m.userId !== admin.id);

    return messages.map((m) => ({
      id: m.id.toString(),
      roomId: m.roomId.toString(),
      senderId: m.senderId ? m.senderId.toString() : null,
      content: m.content,
      type: m.type,
      metadata: m.metadata,
      createdAt: m.createdAt,
      isRead: counterpart?.lastReadMessageId
        ? m.id <= counterpart.lastReadMessageId
        : false,
    }));
  }

  @Patch('rooms/:roomId/messages/:messageId')
  @ApiOperation({
    summary: 'Update Support Message (Admin) / 상담 메시지 수정 (관리자)',
    description:
      'Modify the content of an existing support message sent by an admin. / 관리자가 보낸 기존 상담 메시지의 내용을 수정합니다.',
  })
  @ApiStandardResponse(SupportMessageAdminResponseDto)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ADMIN',
    action: 'UPDATE_SUPPORT_MESSAGE',
    extractMetadata: (req, args) => ({
      roomId: args[1],
      messageId: args[2],
    }),
  })
  async updateMessage(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('roomId') roomIdRaw: string,
    @Param('messageId') messageIdRaw: string,
    @Body() body: UpdateSupportMessageAdminRequestDto,
  ): Promise<SupportMessageAdminResponseDto> {
    const roomId = this.parseId(roomIdRaw);
    const messageId = BigInt(messageIdRaw);

    const updated = await this.updateMessageService.execute({
      messageId,
      content: body.content,
      updaterId: admin.id,
      isAdmin: true,
    });

    // 상대방(사용자)의 마지막 읽은 메시지 ID 확인 (전체 읽음 여부 판단용)
    const members = await this.memberRepository.listByRoomId(roomId);
    const counterpart = members.find((m) => m.userId !== admin.id);

    return {
      id: updated.id.toString(),
      roomId: updated.roomId.toString(),
      senderId: updated.senderId ? updated.senderId.toString() : null,
      content: updated.content,
      type: updated.type,
      metadata: updated.metadata,
      createdAt: updated.createdAt,
      isRead: counterpart?.lastReadMessageId
        ? updated.id <= counterpart.lastReadMessageId
        : false,
    };
  }

  @Delete('rooms/:roomId/messages/:messageId')
  @ApiOperation({
    summary: 'Delete Support Message (Admin) / 상담 메시지 삭제 (관리자)',
    description:
      'Remove a specific support message from the room. / 상담방에서 특정 메시지를 삭제합니다.',
  })
  @ApiStandardResponse(SupportMessageAdminResponseDto)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ADMIN',
    action: 'DELETE_SUPPORT_MESSAGE',
    extractMetadata: (req, args) => ({
      roomId: args[1],
      messageId: args[2],
    }),
  })
  async deleteMessage(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('roomId') roomIdRaw: string,
    @Param('messageId') messageIdRaw: string,
  ): Promise<SupportMessageAdminResponseDto> {
    const roomId = this.parseId(roomIdRaw);
    const messageId = BigInt(messageIdRaw);

    const deleted = await this.deleteMessageService.execute({
      messageId,
      deleterId: admin.id,
      isAdmin: true,
    });

    const members = await this.memberRepository.listByRoomId(roomId);
    const counterpart = members.find((m) => m.userId !== admin.id);

    return {
      id: deleted.id.toString(),
      roomId: deleted.roomId.toString(),
      senderId: deleted.senderId ? deleted.senderId.toString() : null,
      content: deleted.content,
      type: deleted.type,
      metadata: deleted.metadata,
      createdAt: deleted.createdAt,
      isRead: counterpart?.lastReadMessageId
        ? deleted.id <= counterpart.lastReadMessageId
        : false,
    };
  }

  @Post('rooms/:roomId/messages')
  @ApiOperation({
    summary: 'Send Support Reply (Admin) / 상담 답장 전송 (관리자)',
    description:
      'Send a reply message to the customer in the support inquiry room. / 상담 문의 방에서 고객에게 답장 메시지를 전송합니다.',
  })
  @ApiStandardResponse(SendSupportMessageAdminResponseDto)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ADMIN',
    action: 'SEND_SUPPORT_REPLY',
    extractMetadata: (req, args) => ({
      roomId: args[1],
    }),
  })
  async sendReply(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('roomId') roomIdRaw: string,
    @Body() body: SendSupportMessageAdminRequestDto,
  ): Promise<SendSupportMessageAdminResponseDto> {
    const roomId = this.parseId(roomIdRaw);

    let imageIds: bigint[] | undefined;
    if (body.imageIds && body.imageIds.length > 0) {
      imageIds = body.imageIds.map((id) => BigInt(id));
    }

    const message = await this.sendSupportMessageService.execute({
      roomId,
      senderId: admin.id,
      content: body.content,
      isAdmin: true,
      imageIds,
    });

    return {
      id: message.id.toString(),
    };
  }

  @Post('rooms/:roomId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Mark Support Messages as Read (Admin) / 상담 메시지 읽음 처리 (관리자)',
    description:
      'Update the last read message pointer for the admin in the support room. / 상담방에서 관리자의 마지막 읽은 메시지 위치를 업데이트합니다.',
  })
  @ApiStandardResponse(Boolean)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ADMIN',
    action: 'MARK_SUPPORT_READ',
    extractMetadata: (req, args) => ({
      roomId: args[1],
    }),
  })
  async markAsRead(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('roomId') roomIdRaw: string,
    @Body() body: MarkSupportChatReadAdminRequestDto,
  ): Promise<boolean> {
    const roomId = this.parseId(roomIdRaw);
    const lastReadMessageId = BigInt(body.lastReadMessageId);

    await this.readMessagesService.execute({
      roomId,
      userId: admin.id,
      lastReadMessageId,
    });

    return true;
  }
}
