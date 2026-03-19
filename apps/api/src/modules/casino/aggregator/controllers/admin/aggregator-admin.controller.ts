import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LogType } from 'src/modules/audit-log/domain';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { FindAggregatorsService } from '../../application/find-aggregators.service';
import { UpdateAggregatorService } from '../../application/update-aggregator.service';
import { AggregatorRegistryService } from '../../application/aggregator-registry.service';
import { UpdateAggregatorDto } from './dto/request/update-aggregator.dto';
import { AggregatorResponseDto } from './dto/response/aggregator.response.dto';
import { CasinoAggregator } from '../../domain';

@ApiTags('Admin Casino Aggregator')
@Controller('admin/casino/aggregators')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class AggregatorAdminController {
  constructor(
    private readonly findAggregatorsService: FindAggregatorsService,
    private readonly updateAggregatorService: UpdateAggregatorService,
    private readonly registryService: AggregatorRegistryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List aggregators / 애그리게이터 목록 조회' })
  async findAll(): Promise<AggregatorResponseDto[]> {
    const aggregators = await this.findAggregatorsService.execute();
    return aggregators.map((agg) => this.toResponseDto(agg));
  }

  @Put(':id')
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'CASINO',
    action: 'AGGREGATOR_UPDATE',
  })
  @ApiOperation({ summary: 'Update aggregator / 애그리게이터 수정' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAggregatorDto,
  ): Promise<AggregatorResponseDto> {
    const aggregator = await this.updateAggregatorService.execute({
      id: BigInt(id),
      ...dto,
    });
    await this.registryService.reload(); // 캐시 갱신
    return this.toResponseDto(aggregator);
  }

  @Post('reload')
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'CASINO',
    action: 'AGGREGATOR_UPDATE',
  })
  @ApiOperation({
    summary: 'Reload aggregator cache / 애그리게이터 캐시 수동 리로드',
  })
  async reload(): Promise<{ message: string }> {
    await this.registryService.reload();
    return { message: 'Aggregator cache reloaded successfully' };
  }

  private toResponseDto(aggregator: CasinoAggregator): AggregatorResponseDto {
    return {
      id: aggregator.id!.toString(),
      name: aggregator.name,
      code: aggregator.code,
      status: aggregator.status,
      apiEnabled: aggregator.apiEnabled,
      createdAt: aggregator.createdAt,
      updatedAt: aggregator.updatedAt,
    };
  }
}
