import { Controller, Get, Req } from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from 'src/common/http/decorators/api-response.decorator';
import { ListChatRoomsService } from '../../application/list-chat-rooms.service';
import { ChatRoomAdminResponseDto } from './dto/response/chat-room-admin.response.dto';
import type { ChatRoom } from '../../domain/chat-room.entity';

@Controller('admin/chat/rooms')
@ApiTags('Admin Chat Rooms')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiCookieAuth()
@ApiBearerAuth()
@ApiStandardErrors()
export class ChatRoomAdminController {
  constructor(private readonly listRoomService: ListChatRoomsService) {}

  @Get()
  @ApiOperation({ summary: 'List All Chat Rooms / 모든 채팅방 목록 조회' })
  @ApiStandardResponse(ChatRoomAdminResponseDto, { isArray: true })
  async list(): Promise<ChatRoomAdminResponseDto[]> {
    const rooms = await this.listRoomService.execute();
    return rooms.map((room) => this.mapToResponse(room));
  }

  private mapToResponse(room: ChatRoom): ChatRoomAdminResponseDto {
    return {
      id: room.id.toString(),
      type: room.type,
      isActive: room.isActive,
      metadata: room.metadata,
      slowModeSeconds: room.slowModeSeconds,
      minTierLevel: room.minTierLevel,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      lastMessageAt: room.lastMessageAt,
    };
  }
}
