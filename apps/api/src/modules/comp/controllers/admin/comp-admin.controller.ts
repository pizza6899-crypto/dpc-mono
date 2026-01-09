import { Body, Controller, Get, Param, Post, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ExchangeCurrencyCode, Prisma, UserRoleType } from '@repo/database';
import { FindCompBalanceService } from '../../application/find-comp-balance.service';
import { EarnCompService } from '../../application/earn-comp.service';
import { CompBalanceResponseDto } from '../user/dto/response/comp-balance.response.dto';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { AdminCompAdjustRequestDto, AdminCompAdjustType } from './dto/request/admin-comp-adjust.request.dto';

@ApiTags('Admin Comp')
@Controller('admin/comp')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class CompAdminController {
    constructor(
        private readonly findCompBalanceService: FindCompBalanceService,
        private readonly earnCompService: EarnCompService,
    ) { }

    @Get('users/:userId/balance')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get user comp balance (Admin)' })
    @ApiParam({ name: 'userId', example: '1' })
    async getUserBalance(
        @Param('userId') userId: string,
        @Query('currency') currency: ExchangeCurrencyCode,
    ): Promise<CompBalanceResponseDto> {
        const wallet = await this.findCompBalanceService.execute(BigInt(userId), currency);
        return CompBalanceResponseDto.fromDomain(wallet);
    }

    @Post('users/:userId/adjust')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Adjust user comp balance (GIVE/DEDUCT)' })
    @ApiParam({ name: 'userId', example: '1' })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'COMP',
        action: 'ADJUST_BALANCE',
    })
    async adjustUserComp(
        @Param('userId') userId: string,
        @Body() dto: AdminCompAdjustRequestDto,
    ): Promise<any> {
        const uid = BigInt(userId);
        const amount = new Prisma.Decimal(dto.amount);

        if (dto.type === AdminCompAdjustType.GIVE) {
            const wallet = await this.earnCompService.execute({
                userId: uid,
                currency: dto.currency,
                amount: amount,
                description: dto.reason || 'Admin Adjustment',
                referenceId: `ADMIN-${Date.now()}`
            });
            return { success: true, newBalance: wallet.balance.toString() };
        } else {
            // Deduct logic implementation needed
            return { success: false, message: 'DEDUCT not implemented yet' };
        }
    }
}
