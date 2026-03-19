import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Put,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from 'src/common/http/decorators/api-response.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { GetChatConfigService } from '../../application/get-chat-config.service';
import { UpdateChatConfigService } from '../../application/update-chat-config.service';
import { ChatConfigAdminResponseDto } from './dto/response/chat-config-admin.response.dto';
import { UpdateChatConfigAdminRequestDto } from './dto/request/update-chat-config-admin.request.dto';

@Controller('admin/chat/config')
@ApiTags('Admin Chat Config')
@ApiStandardErrors()
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiCookieAuth()
@ApiBearerAuth()
export class ChatConfigAdminController {
  constructor(
    private readonly getChatConfigService: GetChatConfigService,
    private readonly updateChatConfigService: UpdateChatConfigService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get global chat configuration / 글로벌 채팅 설정 조회',
    description:
      'Retrieves global settings for the chat system. / 채팅 시스템의 전역 설정을 조회합니다.',
  })
  @ApiStandardResponse(ChatConfigAdminResponseDto)
  async getConfig(): Promise<ChatConfigAdminResponseDto> {
    return await this.getChatConfigService.execute();
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update global chat configuration / 글로벌 채팅 설정 수정',
    description:
      'Updates global settings for the chat system. / 채팅 시스템의 전역 설정을 수정합니다.',
  })
  @ApiStandardResponse(ChatConfigAdminResponseDto)
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'UPDATE_CHAT_CONFIG',
    category: 'CHAT',
    extractMetadata: (req) => ({
      before: req.__audit_before,
      after: req.__audit_after,
    }),
  })
  async updateConfig(
    @Body() dto: UpdateChatConfigAdminRequestDto,
    @Req() req: any,
  ): Promise<ChatConfigAdminResponseDto> {
    // For Audit Log
    const before = await this.getChatConfigService.execute();

    await this.updateChatConfigService.execute(dto);

    const after = await this.getChatConfigService.execute();

    req.__audit_before = before;
    req.__audit_after = after;

    return after;
  }
}
