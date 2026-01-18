import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LogType } from 'src/modules/audit-log/domain';
import { Admin } from 'src/common/auth/decorators/roles.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { FindAggregatorService } from '../../application/find-aggregator.service';
import { FindAggregatorsService } from '../../application/find-aggregators.service';
import { CreateAggregatorService } from '../../application/create-aggregator.service';
import { UpdateAggregatorService } from '../../application/update-aggregator.service';
import { AggregatorRegistryService } from '../../application/aggregator-registry.service';
import { CreateAggregatorDto } from './dto/request/create-aggregator.dto';
import { UpdateAggregatorDto } from './dto/request/update-aggregator.dto';
import { AggregatorResponseDto } from './dto/response/aggregator.response.dto';

@ApiTags('Admin/Casino/Aggregator')
@Controller('admin/casino/aggregators')
@Admin()
export class AggregatorAdminController {
    constructor(
        private readonly findAggregatorService: FindAggregatorService,
        private readonly findAggregatorsService: FindAggregatorsService,
        private readonly createAggregatorService: CreateAggregatorService,
        private readonly updateAggregatorService: UpdateAggregatorService,
        private readonly registryService: AggregatorRegistryService,
    ) { }

    @Get()
    @ApiOperation({ summary: '애그리게이터 목록 조회' })
    async findAll(): Promise<AggregatorResponseDto[]> {
        const aggregators = await this.findAggregatorsService.execute();
        return aggregators.map(AggregatorResponseDto.from);
    }

    @Get(':id')
    @ApiOperation({ summary: '애그리게이터 상세 조회' })
    async findOne(@Param('id') id: string): Promise<AggregatorResponseDto> {
        const aggregator = await this.findAggregatorService.execute({ id: BigInt(id) });
        return AggregatorResponseDto.from(aggregator);
    }

    @Post()
    @AuditLog({ type: LogType.ACTIVITY, category: 'CASINO', action: 'AGGREGATOR_CREATE' })
    @ApiOperation({ summary: '애그리게이터 생성' })
    async create(@Body() dto: CreateAggregatorDto): Promise<AggregatorResponseDto> {
        const aggregator = await this.createAggregatorService.execute(dto);
        await this.registryService.reload(); // 캐시 갱신
        return AggregatorResponseDto.from(aggregator);
    }

    @Put(':id')
    @AuditLog({ type: LogType.ACTIVITY, category: 'CASINO', action: 'AGGREGATOR_CREATE' })
    @ApiOperation({ summary: '애그리게이터 수정' })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateAggregatorDto,
    ): Promise<AggregatorResponseDto> {
        const aggregator = await this.updateAggregatorService.execute({ id: BigInt(id), ...dto });
        await this.registryService.reload(); // 캐시 갱신
        return AggregatorResponseDto.from(aggregator);
    }

    @Post('reload')
    @AuditLog({ type: LogType.ACTIVITY, category: 'CASINO', action: 'AGGREGATOR_UPDATE' })
    @ApiOperation({ summary: '애그리게이터 캐시 수동 리로드' })
    async reload(): Promise<{ message: string }> {
        await this.registryService.reload();
        return { message: 'Aggregator cache reloaded successfully' };
    }
}
