import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExchangeRateService } from '../application/exchange-rate.service';
import { SessionAuthGuard } from 'src/platform/auth/guards/session-auth.guard';
import { RequireRoles } from 'src/platform/auth/decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';
import { Throttle } from 'src/platform/throttle/decorators/throttle.decorator';
import { ThrottleScope } from 'src/platform/throttle/types/throttle.types';

@ApiTags('Admin Exchange Management (관리자 환율 관리)')
@Controller('admin/exchange')
@UseGuards(SessionAuthGuard)
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class AdminExchangeController {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  @Post('cache/clear')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    limit: 10,
    ttl: 60, // 1분에 최대 10번
    scope: ThrottleScope.USER,
  })
  @ApiOperation({
    summary: 'Clear exchange rate cache / 환율 캐시 삭제',
    description:
      'Clears all cached exchange rates in Redis. (Redis에 저장된 환율 캐시를 모두 삭제합니다.)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache cleared successfully / 캐시 삭제 성공',
  })
  async clearCache(): Promise<{ success: boolean }> {
    await this.exchangeRateService.clearAllCache();
    return { success: true };
  }
}
