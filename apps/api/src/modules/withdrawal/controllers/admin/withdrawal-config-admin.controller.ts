import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Put,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import { UserRoleType } from '@repo/database';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import {
    ApiStandardResponse,
    ApiStandardErrors,
    ApiPaginatedResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';

import {
    CreateCryptoConfigService,
    UpdateCryptoConfigService,
    FindCryptoConfigsAdminService,
    ToggleCryptoConfigActiveService,
    DeleteCryptoConfigService,
    CreateBankConfigService,
    UpdateBankConfigService,
    FindBankConfigsAdminService,
    ToggleBankConfigActiveService,
    DeleteBankConfigService,
} from '../../application';

import {
    CreateCryptoConfigDto,
    UpdateCryptoConfigDto,
    FindCryptoConfigsRequestDto,
    CreateBankConfigDto,
    UpdateBankConfigDto,
    FindBankConfigsRequestDto,
    WithdrawalCryptoConfigResponseDto,
    WithdrawalBankConfigResponseDto,
} from './dto';
import { CryptoWithdrawConfig, BankWithdrawConfig } from '../../domain';

@ApiTags('Admin Withdrawal Config')
@Controller('admin/withdrawals/config')
@ApiBearerAuth()
@ApiStandardErrors()
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class WithdrawalConfigAdminController {
    constructor(
        // Crypto Services
        private readonly createCryptoConfigService: CreateCryptoConfigService,
        private readonly updateCryptoConfigService: UpdateCryptoConfigService,
        private readonly findCryptoConfigsService: FindCryptoConfigsAdminService,
        private readonly toggleCryptoConfigActiveService: ToggleCryptoConfigActiveService,
        private readonly deleteCryptoConfigService: DeleteCryptoConfigService,

        // Bank Services
        private readonly createBankConfigService: CreateBankConfigService,
        private readonly updateBankConfigService: UpdateBankConfigService,
        private readonly findBankConfigsService: FindBankConfigsAdminService,
        private readonly toggleBankConfigActiveService: ToggleBankConfigActiveService,
        private readonly deleteBankConfigService: DeleteBankConfigService,
    ) { }

    // ===== Crypto Configs =====

    @ApiOperation({ summary: 'Get crypto withdrawal configs' })
    @Get('crypto')
    @ApiPaginatedResponse(WithdrawalCryptoConfigResponseDto)
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'VIEW_CRYPTO_CONFIGS',
        category: 'WITHDRAWAL_CONFIG',
    })
    async getCryptoConfigs(
        @Query() query: FindCryptoConfigsRequestDto,
    ): Promise<{ configs: WithdrawalCryptoConfigResponseDto[]; total: number }> {
        const { configs, total } = await this.findCryptoConfigsService.execute(query);
        return {
            configs: configs.map(this.toCryptoResponse),
            total,
        };
    }

    @ApiOperation({ summary: 'Create crypto withdrawal config' })
    @Post('crypto')
    @ApiStandardResponse(WithdrawalCryptoConfigResponseDto, { status: HttpStatus.CREATED })
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'CREATE_CRYPTO_CONFIG',
        category: 'WITHDRAWAL_CONFIG',
        extractMetadata: (dto) => dto,
    })
    async createCryptoConfig(
        @Body() dto: CreateCryptoConfigDto,
    ): Promise<WithdrawalCryptoConfigResponseDto> {
        const config = await this.createCryptoConfigService.execute(dto);
        return this.toCryptoResponse(config);
    }

    @ApiOperation({ summary: 'Update crypto withdrawal config' })
    @Put('crypto/:id')
    @ApiParam({ name: 'id', type: String })
    @ApiStandardResponse(WithdrawalCryptoConfigResponseDto)
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'UPDATE_CRYPTO_CONFIG',
        category: 'WITHDRAWAL_CONFIG',
        extractMetadata: (id, dto) => ({ id, ...dto }),
    })
    async updateCryptoConfig(
        @Param('id') id: string,
        @Body() dto: UpdateCryptoConfigDto,
    ): Promise<WithdrawalCryptoConfigResponseDto> {
        const config = await this.updateCryptoConfigService.execute({
            id: BigInt(id),
            ...dto,
        });
        return this.toCryptoResponse(config);
    }

    @ApiOperation({ summary: 'Toggle crypto withdrawal config active state' })
    @Patch('crypto/:id/active')
    @ApiParam({ name: 'id', type: String })
    @ApiStandardResponse(WithdrawalCryptoConfigResponseDto)
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'TOGGLE_CRYPTO_CONFIG_ACTIVE',
        category: 'WITHDRAWAL_CONFIG',
        extractMetadata: (id) => ({ id }),
    })
    async toggleCryptoConfigActive(
        @Param('id') id: string,
    ): Promise<WithdrawalCryptoConfigResponseDto> {
        const config = await this.toggleCryptoConfigActiveService.execute(BigInt(id));
        return this.toCryptoResponse(config);
    }

    @ApiOperation({ summary: 'Delete crypto withdrawal config' })
    @Delete('crypto/:id')
    @ApiParam({ name: 'id', type: String })
    @HttpCode(HttpStatus.NO_CONTENT)
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'DELETE_CRYPTO_CONFIG',
        category: 'WITHDRAWAL_CONFIG',
        extractMetadata: (id) => ({ id }),
    })
    async deleteCryptoConfig(
        @Param('id') id: string,
    ): Promise<void> {
        await this.deleteCryptoConfigService.execute(BigInt(id));
    }

    // ===== Bank Configs =====

    @ApiOperation({ summary: 'Get bank withdrawal configs' })
    @Get('bank')
    @ApiPaginatedResponse(WithdrawalBankConfigResponseDto)
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'VIEW_BANK_CONFIGS',
        category: 'WITHDRAWAL_CONFIG',
    })
    async getBankConfigs(
        @Query() query: FindBankConfigsRequestDto,
    ): Promise<{ configs: WithdrawalBankConfigResponseDto[]; total: number }> {
        const { configs, total } = await this.findBankConfigsService.execute(query);
        return {
            configs: configs.map(this.toBankResponse),
            total,
        };
    }

    @ApiOperation({ summary: 'Create bank withdrawal config' })
    @Post('bank')
    @ApiStandardResponse(WithdrawalBankConfigResponseDto, { status: HttpStatus.CREATED })
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'CREATE_BANK_CONFIG',
        category: 'WITHDRAWAL_CONFIG',
        extractMetadata: (dto) => dto,
    })
    async createBankConfig(
        @Body() dto: CreateBankConfigDto,
    ): Promise<WithdrawalBankConfigResponseDto> {
        const config = await this.createBankConfigService.execute(dto);
        return this.toBankResponse(config);
    }

    @ApiOperation({ summary: 'Update bank withdrawal config' })
    @Put('bank/:id')
    @ApiParam({ name: 'id', type: String })
    @ApiStandardResponse(WithdrawalBankConfigResponseDto)
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'UPDATE_BANK_CONFIG',
        category: 'WITHDRAWAL_CONFIG',
        extractMetadata: (id, dto) => ({ id, ...dto }),
    })
    async updateBankConfig(
        @Param('id') id: string,
        @Body() dto: UpdateBankConfigDto,
    ): Promise<WithdrawalBankConfigResponseDto> {
        const config = await this.updateBankConfigService.execute({
            id: BigInt(id),
            ...dto,
        });
        return this.toBankResponse(config);
    }

    @ApiOperation({ summary: 'Toggle bank withdrawal config active state' })
    @Patch('bank/:id/active')
    @ApiParam({ name: 'id', type: String })
    @ApiStandardResponse(WithdrawalBankConfigResponseDto)
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'TOGGLE_BANK_CONFIG_ACTIVE',
        category: 'WITHDRAWAL_CONFIG',
        extractMetadata: (id) => ({ id }),
    })
    async toggleBankConfigActive(
        @Param('id') id: string,
    ): Promise<WithdrawalBankConfigResponseDto> {
        const config = await this.toggleBankConfigActiveService.execute(BigInt(id));
        return this.toBankResponse(config);
    }

    @ApiOperation({ summary: 'Delete bank withdrawal config' })
    @Delete('bank/:id')
    @ApiParam({ name: 'id', type: String })
    @HttpCode(HttpStatus.NO_CONTENT)
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'DELETE_BANK_CONFIG',
        category: 'WITHDRAWAL_CONFIG',
        extractMetadata: (id) => ({ id }),
    })
    async deleteBankConfig(
        @Param('id') id: string,
    ): Promise<void> {
        await this.deleteBankConfigService.execute(BigInt(id));
    }

    // ===== Helpers =====

    private toCryptoResponse(config: CryptoWithdrawConfig): WithdrawalCryptoConfigResponseDto {
        return {
            id: config.id.toString(),
            symbol: config.props.symbol,
            network: config.props.network,
            isActive: config.props.isActive,
            minWithdrawAmount: config.props.minWithdrawAmount.toString(),
            maxWithdrawAmount: config.props.maxWithdrawAmount?.toString() ?? null,
            autoProcessLimit: config.props.autoProcessLimit?.toString() ?? null,
            withdrawFeeFixed: config.props.withdrawFeeFixed.toString(),
            withdrawFeeRate: config.props.withdrawFeeRate.toString(),
            createdAt: config.props.createdAt,
            updatedAt: config.props.updatedAt,
        };
    }

    private toBankResponse(config: BankWithdrawConfig): WithdrawalBankConfigResponseDto {
        return {
            id: config.id.toString(),
            currency: config.props.currency,
            bankName: config.props.bankName,
            isActive: config.props.isActive,
            minWithdrawAmount: config.props.minWithdrawAmount.toString(),
            maxWithdrawAmount: config.props.maxWithdrawAmount?.toString() ?? null,
            withdrawFeeFixed: config.props.withdrawFeeFixed.toString(),
            withdrawFeeRate: config.props.withdrawFeeRate.toString(),
            description: config.props.description,
            notes: config.props.notes,
            createdAt: config.props.createdAt,
            updatedAt: config.props.updatedAt,
        };
    }
}
