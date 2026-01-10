import {
    Controller,
    Post,
    Body,
    Get,
    Param,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import {
    ApiStandardResponse,
    ApiStandardErrors,
} from 'src/common/http/decorators/api-response.decorator';
import type { RequestClientInfo } from 'src/common/http/types';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { ExchangeCurrencyCode } from '@repo/database';
import {
    RequestCryptoWithdrawalService,
    CancelWithdrawalService,
    FindWithdrawalsService,
    GetWithdrawalService,
} from '../../application';
import {
    RequestCryptoWithdrawalDto,
    GetWithdrawalsQueryDto,
    WithdrawalResponseDto,
    CreateWithdrawalResponseDto,
    CancelWithdrawalResponseDto,
} from './dto';

@ApiTags('Withdrawal')
@Controller('withdrawals')
@ApiBearerAuth()
@ApiStandardErrors()
export class WithdrawalUserController {
    constructor(
        private readonly requestCryptoWithdrawalService: RequestCryptoWithdrawalService,
        private readonly cancelWithdrawalService: CancelWithdrawalService,
        private readonly findWithdrawalsService: FindWithdrawalsService,
        private readonly getWithdrawalService: GetWithdrawalService,
    ) { }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get my withdrawal list',
        description: 'Retrieve my withdrawal history with pagination.',
    })
    @ApiStandardResponse(WithdrawalResponseDto, {
        status: 200,
        description: 'Withdrawal list retrieved successfully',
        isArray: true,
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'VIEW_MY_WITHDRAWAL_LIST',
        category: 'WITHDRAWAL',
    })
    async getMyWithdrawals(
        @Query() query: GetWithdrawalsQueryDto,
        @CurrentUser() user: CurrentUserWithSession,
        @RequestClientInfoParam() requestInfo: RequestClientInfo,
    ): Promise<{ withdrawals: WithdrawalResponseDto[]; total: number }> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const offset = (page - 1) * limit;

        const result = await this.findWithdrawalsService.execute({
            userId: user.id,
            status: query.status,
            methodType: query.methodType,
            limit,
            offset,
        });

        return {
            withdrawals: result.withdrawals.map(WithdrawalResponseDto.fromDomain),
            total: result.total,
        };
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get withdrawal detail',
        description: 'Retrieve detailed information of a specific withdrawal.',
    })
    @ApiParam({
        name: 'id',
        description: 'Withdrawal ID',
        type: String,
    })
    @ApiStandardResponse(WithdrawalResponseDto, {
        status: 200,
        description: 'Withdrawal detail retrieved successfully',
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'VIEW_WITHDRAWAL_DETAIL',
        category: 'WITHDRAWAL',
        extractMetadata: (_, args) => ({
            withdrawalId: args[0],
        }),
    })
    async getWithdrawalDetail(
        @Param('id') id: string,
        @CurrentUser() user: CurrentUserWithSession,
        @RequestClientInfoParam() requestInfo: RequestClientInfo,
    ): Promise<WithdrawalResponseDto> {
        const withdrawal = await this.getWithdrawalService.execute({
            userId: user.id,
            withdrawalId: BigInt(id),
        });
        return WithdrawalResponseDto.fromDomain(withdrawal);
    }

    @Post('crypto')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Request crypto withdrawal',
        description: 'Create a new cryptocurrency withdrawal request.',
    })
    @ApiStandardResponse(CreateWithdrawalResponseDto, {
        status: 201,
        description: 'Crypto withdrawal request created successfully',
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'CREATE_CRYPTO_WITHDRAWAL_REQUEST',
        category: 'WITHDRAWAL',
        extractMetadata: (_, args) => ({
            symbol: args[0]?.symbol,
            network: args[0]?.network,
            amount: args[0]?.amount,
        }),
    })
    async requestCryptoWithdrawal(
        @Body() dto: RequestCryptoWithdrawalDto,
        @CurrentUser() user: CurrentUserWithSession,
        @RequestClientInfoParam() clientInfo: RequestClientInfo,
    ): Promise<CreateWithdrawalResponseDto> {
        const result = await this.requestCryptoWithdrawalService.execute({
            userId: user.id,
            currency: dto.symbol as ExchangeCurrencyCode,
            amount: dto.amount,
            symbol: dto.symbol,
            network: dto.network,
            walletAddress: dto.walletAddress,
            walletAddressExtraId: dto.walletAddressExtraId,
            ipAddress: clientInfo.ip,
            deviceFingerprint: clientInfo.userAgent,
        });

        return {
            withdrawalId: result.withdrawalId.toString(),
            status: result.status,
            processingMode: result.processingMode,
            requestedAmount: result.requestedAmount,
            feeAmount: result.feeAmount ?? undefined,
            netAmount: result.netAmount,
        };
    }

    @Post(':id/cancel')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Cancel withdrawal request',
        description: 'Cancel a pending withdrawal request.',
    })
    @ApiParam({
        name: 'id',
        description: 'Withdrawal ID',
        type: String,
    })
    @ApiStandardResponse(CancelWithdrawalResponseDto, {
        status: 200,
        description: 'Withdrawal request cancelled successfully',
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'CANCEL_WITHDRAWAL_REQUEST',
        category: 'WITHDRAWAL',
        extractMetadata: (_, args) => ({
            withdrawalId: args[0],
        }),
    })
    async cancelWithdrawal(
        @Param('id') id: string,
        @CurrentUser() user: CurrentUserWithSession,
        @RequestClientInfoParam() requestInfo: RequestClientInfo,
    ): Promise<CancelWithdrawalResponseDto> {
        const result = await this.cancelWithdrawalService.execute({
            userId: user.id,
            withdrawalId: BigInt(id),
        });

        return {
            withdrawalId: result.withdrawalId.toString(),
            status: result.status,
            cancelledAt: result.cancelledAt,
        };
    }
}
