// src/modules/comp/controllers/comp.controller.ts
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { CompService } from '../application/comp.service';
import { CurrentUser } from 'src/platform/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/platform/auth/decorators/current-user.decorator';
import {
  ClaimCompRequestDto,
  UnclaimedCompResponseDto,
} from '../dtos/comp-balance.dto';

@Controller('comp')
export class CompController {
  constructor(private readonly compService: CompService) {}

  /**
   * 콤프 수령
   */
  @Post('claim')
  async claimComp(
    @CurrentUser() user: CurrentUserWithSession,
    @Body() dto: ClaimCompRequestDto,
  ) {
    return await this.compService.claimComp(user.id, dto.date);
  }

  /**
   * 미수령 콤프 내역 조회
   */
  @Get('unclaimed')
  async getUnclaimedComp(
    @CurrentUser() user: CurrentUserWithSession,
  ): Promise<UnclaimedCompResponseDto[]> {
    return await this.compService.getUnclaimedComp(user.id);
  }
}
