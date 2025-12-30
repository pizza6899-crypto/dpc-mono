import { Controller, Get, Query, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { VipMembershipService } from '../application/vip-membership.service';
import {
  VipMembershipResponseDto,
  VipHistoryResponseDto,
} from '../dtos/vip-membership.dto';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';

@ApiTags('VIP Membership')
@Controller('vip/membership')
export class VipMembershipController {
  constructor(private readonly vipMembershipService: VipMembershipService) {}

  @Get()
  @ApiOperation({ summary: '내 VIP 정보 조회' })
  @ApiResponse({ status: HttpStatus.OK, type: VipMembershipResponseDto })
  async getMyVipInfo(
    @CurrentUser() user: CurrentUserWithSession,
  ): Promise<VipMembershipResponseDto> {
    return await this.vipMembershipService.getUserVipInfo(user.id);
  }
}
