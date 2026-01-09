import { Body, Controller, Get, Post, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { ExchangeCurrencyCode, Prisma } from '@repo/database';
import { ClaimCompService } from '../../application/claim-comp.service';
import { FindCompBalanceService } from '../../application/find-comp-balance.service';
import { ClaimCompRequestDto } from './dto/request/claim-comp.request.dto';
import { CompBalanceResponseDto } from './dto/response/comp-balance.response.dto';
import { ApiStandardResponse, ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';

@ApiTags('Comp')
@Controller('user/comp')
@ApiStandardErrors()
export class CompUserController {
    constructor(
        private readonly claimCompService: ClaimCompService,
        private readonly findCompBalanceService: FindCompBalanceService,
    ) { }

    @Get('balance')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get user comp balance' })
    @ApiStandardResponse(CompBalanceResponseDto)
    async getBalance(
        @CurrentUser() user: any,
        @Query('currency') currency: ExchangeCurrencyCode,
    ): Promise<CompBalanceResponseDto> {
        const userId = BigInt(user.id);
        const wallet = await this.findCompBalanceService.execute(userId, currency);
        return CompBalanceResponseDto.fromDomain(wallet);
    }

    @Post('claim')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Claim comp points as cash' })
    async claim(
        @CurrentUser() user: any,
        @Body() dto: ClaimCompRequestDto,
    ): Promise<any> {
        const userId = BigInt(user.id);
        const result = await this.claimCompService.execute({
            userId,
            currency: dto.currency,
            amount: new Prisma.Decimal(dto.amount),
        });

        return {
            success: true,
            claimedAmount: result.claimedAmount.toString(),
            newCompBalance: result.newCompBalance.toString(),
            newCashBalance: result.newCashBalance.toString(),
        };
    }
}
