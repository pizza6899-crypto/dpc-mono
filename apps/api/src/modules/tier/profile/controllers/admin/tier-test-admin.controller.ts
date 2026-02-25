import {
    Controller,
    Post,
    Body,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
    NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeController } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { EnvService } from 'src/common/env/env.service';
import { AccumulateUserRollingService } from '../../../evaluator/application/accumulate-user-rolling.service';
import { AccumulateUserDepositService } from '../../../evaluator/application/accumulate-user-deposit.service';
import { EvaluateUserTierService } from '../../../evaluator/application/evaluate-user-tier.service';
import { TierRepositoryPort } from '../../../config/infrastructure/tier.repository.port';
import { AdminTestTierPerformanceRequestDto } from './dto/request/admin-test-tier-performance.dto';

@ApiTags('Admin User Tiers Test')
@Controller('admin/user-tiers/test')
@ApiExcludeController(process.env.NODE_ENV === 'production')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class TierTestAdminController {
    constructor(
        private readonly envService: EnvService,
        private readonly accumulateRollingService: AccumulateUserRollingService,
        private readonly accumulateDepositService: AccumulateUserDepositService,
        private readonly evaluateUserTierService: EvaluateUserTierService,
        private readonly tierRepository: TierRepositoryPort,
    ) { }

    @Post('users/:userId/accumulate-rolling')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: '[TEST] Accumulate rolling for user' })
    async testAccumulateRolling(
        @Param('userId') userId: string,
        @Body() dto: AdminTestTierPerformanceRequestDto,
    ): Promise<void> {
        this.ensureNotProduction();
        await this.accumulateRollingService.execute(BigInt(userId), dto.amountUsd);
    }

    @Post('users/:userId/accumulate-deposit')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: '[TEST] Accumulate deposit for user' })
    async testAccumulateDeposit(
        @Param('userId') userId: string,
        @Body() dto: AdminTestTierPerformanceRequestDto,
    ): Promise<void> {
        this.ensureNotProduction();
        await this.accumulateDepositService.execute(BigInt(userId), dto.amountUsd);
    }

    @Post('users/:userId/evaluate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: '[TEST] Force evaluate maintenance/demotion for user' })
    async testEvaluate(@Param('userId') userId: string): Promise<void> {
        this.ensureNotProduction();
        const allTiers = await this.tierRepository.findAll();
        await this.evaluateUserTierService.evaluateUser(BigInt(userId), allTiers);
    }

    private ensureNotProduction() {
        if (this.envService.nodeEnv === 'production') {
            throw new NotFoundException('Test endpoint is not available in production');
        }
    }
}
