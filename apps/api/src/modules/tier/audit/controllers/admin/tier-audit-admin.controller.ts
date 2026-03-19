import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GetTierDistributionService } from '../../application/get-tier-distribution.service';
import { TierDistributionResponseDto } from './dto/tier-distribution.response.dto';
import { GetTierDistributionQueryDto } from './dto/request/get-tier-distribution.query.dto';
import { SessionAuthGuard } from 'src/common/auth/guards/session-auth.guard';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';

@ApiTags('Admin Tier Audit')
@Controller('admin/tier-audit')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class TierAuditAdminController {
  constructor(
    private readonly getTierDistributionService: GetTierDistributionService,
  ) {}

  @Get('distribution')
  @ApiOperation({ summary: 'Get tier distribution / 티어별 유저 분포 조회' })
  @ApiOkResponse({
    type: [TierDistributionResponseDto],
    description:
      'Successfully retrieved tier distribution / 티어별 분포 조회 성공',
  })
  async getTierDistribution(
    @Query() query: GetTierDistributionQueryDto,
  ): Promise<TierDistributionResponseDto[]> {
    const results = await this.getTierDistributionService.execute(query.lang);

    return results.map((result) => ({
      tierId: result.tierId.toString(),
      tierCode: result.tierCode,
      tierName: result.tierName,
      tierLevel: result.tierLevel,
      count: result.count,
    }));
  }
}
