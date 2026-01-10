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
    ApiPaginatedResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import type { PaginatedData, RequestClientInfo } from 'src/common/http/types';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { ExchangeCurrencyCode } from '@repo/database';
import {
    RequestCryptoWithdrawalService,
    RequestBankWithdrawalService,
    CancelWithdrawalService,
    FindWithdrawalsService,
    GetWithdrawalService,
    GetWithdrawalOptionsService,
} from '../../application';
import {
    RequestCryptoWithdrawalDto,
    RequestBankWithdrawalDto,
    GetWithdrawalsQueryDto,
    WithdrawalResponseDto,
    CreateWithdrawalResponseDto,
    CancelWithdrawalResponseDto,
    WithdrawalOptionsResponseDto,
} from './dto';

@ApiTags('Withdrawal')
@Controller('withdrawals')
@ApiBearerAuth()
@ApiStandardErrors()
export class WithdrawalUserController {
    constructor(
        private readonly requestCryptoWithdrawalService: RequestCryptoWithdrawalService,
        private readonly requestBankWithdrawalService: RequestBankWithdrawalService,
        private readonly cancelWithdrawalService: CancelWithdrawalService,
        private readonly findWithdrawalsService: FindWithdrawalsService,
        private readonly getWithdrawalService: GetWithdrawalService,
        private readonly getWithdrawalOptionsService: GetWithdrawalOptionsService,
    ) { }

    @Get()
    @HttpCode(HttpStatus.OK)
    @Paginated()
    @ApiOperation({
        summary: 'Get my withdrawal list',
        description: 'Retrieve my withdrawal history with pagination.',
    })
    @ApiPaginatedResponse(WithdrawalResponseDto, {
        status: 200,
        description: 'Withdrawal list retrieved successfully',
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
    ): Promise<PaginatedData<WithdrawalResponseDto>> {
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
            data: result.withdrawals.map(WithdrawalResponseDto.fromDomain),
            total: result.total,
            page,
            limit,
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

    @Post('bank')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Request bank withdrawal',
        description: 'Create a new bank withdrawal request.',
    })
    @ApiStandardResponse(CreateWithdrawalResponseDto, {
        status: 201,
        description: 'Bank withdrawal request created successfully',
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'CREATE_BANK_WITHDRAWAL_REQUEST',
        category: 'WITHDRAWAL',
        extractMetadata: (_, args) => ({
            bankConfigId: args[0]?.bankConfigId,
            amount: args[0]?.amount,
            bankName: args[0]?.bankName,
        }),
    })
    async requestBankWithdrawal(
        @Body() dto: RequestBankWithdrawalDto,
        @CurrentUser() user: CurrentUserWithSession,
        @RequestClientInfoParam() clientInfo: RequestClientInfo,
    ): Promise<CreateWithdrawalResponseDto> {
        const result = await this.requestBankWithdrawalService.execute({
            userId: user.id,
            currency: ExchangeCurrencyCode.KRW, // TODO: Config에서 currency 가져오기
            amount: dto.amount,
            bankConfigId: BigInt(dto.bankConfigId),
            bankName: dto.bankName,
            accountNumber: dto.accountNumber,
            accountHolder: dto.accountHolder,
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

    @Get('options')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get withdrawal options',
        description: 'Retrieve available withdrawal methods (crypto and bank).',
    })
    @ApiStandardResponse(WithdrawalOptionsResponseDto, {
        status: 200,
        description: 'Withdrawal options retrieved successfully',
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'VIEW_WITHDRAWAL_OPTIONS',
        category: 'WITHDRAWAL',
    })
    async getWithdrawalOptions(
        @CurrentUser() user: CurrentUserWithSession,
        @RequestClientInfoParam() requestInfo: RequestClientInfo,
    ): Promise<WithdrawalOptionsResponseDto> {
        return await this.getWithdrawalOptionsService.execute();
    }
}
