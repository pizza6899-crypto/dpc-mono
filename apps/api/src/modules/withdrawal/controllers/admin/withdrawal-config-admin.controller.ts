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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '@repo/database';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';

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
    CryptoConfigResponseDto,
    BankConfigResponseDto,
} from './dto';
import { CryptoWithdrawConfig, BankWithdrawConfig } from '../../domain';

@ApiTags('Admin Withdrawal Config')
@Controller('admin/withdrawals/config')
@ApiBearerAuth()
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

    @ApiOperation({ summary: '암호화폐 출금 설정 목록 조회' })
    @Get('crypto')
    async getCryptoConfigs(
        @Query() query: FindCryptoConfigsRequestDto,
    ): Promise<{ configs: CryptoConfigResponseDto[]; total: number }> {
        const { configs, total } = await this.findCryptoConfigsService.execute(query);
        return {
            configs: configs.map(this.toCryptoResponse),
            total,
        };
    }

    @ApiOperation({ summary: '암호화폐 출금 설정 생성' })
    @Post('crypto')
    async createCryptoConfig(
        @Body() dto: CreateCryptoConfigDto,
    ): Promise<CryptoConfigResponseDto> {
        const config = await this.createCryptoConfigService.execute(dto);
        return this.toCryptoResponse(config);
    }

    @ApiOperation({ summary: '암호화폐 출금 설정 수정' })
    @Put('crypto/:id')
    async updateCryptoConfig(
        @Param('id') id: string,
        @Body() dto: UpdateCryptoConfigDto,
    ): Promise<CryptoConfigResponseDto> {
        const config = await this.updateCryptoConfigService.execute({
            id: BigInt(id),
            ...dto,
        });
        return this.toCryptoResponse(config);
    }

    @ApiOperation({ summary: '암호화폐 출금 설정 활성/비활성 토글' })
    @Patch('crypto/:id/active')
    async toggleCryptoConfigActive(
        @Param('id') id: string,
    ): Promise<CryptoConfigResponseDto> {
        const config = await this.toggleCryptoConfigActiveService.execute(BigInt(id));
        return this.toCryptoResponse(config);
    }

    @ApiOperation({ summary: '암호화폐 출금 설정 삭제' })
    @Delete('crypto/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteCryptoConfig(
        @Param('id') id: string,
    ): Promise<void> {
        await this.deleteCryptoConfigService.execute(BigInt(id));
    }

    // ===== Bank Configs =====

    @ApiOperation({ summary: '은행 출금 설정 목록 조회' })
    @Get('bank')
    async getBankConfigs(
        @Query() query: FindBankConfigsRequestDto,
    ): Promise<{ configs: BankConfigResponseDto[]; total: number }> {
        const { configs, total } = await this.findBankConfigsService.execute(query);
        return {
            configs: configs.map(this.toBankResponse),
            total,
        };
    }

    @ApiOperation({ summary: '은행 출금 설정 생성' })
    @Post('bank')
    async createBankConfig(
        @Body() dto: CreateBankConfigDto,
    ): Promise<BankConfigResponseDto> {
        const config = await this.createBankConfigService.execute(dto);
        return this.toBankResponse(config);
    }

    @ApiOperation({ summary: '은행 출금 설정 수정' })
    @Put('bank/:id')
    async updateBankConfig(
        @Param('id') id: string,
        @Body() dto: UpdateBankConfigDto,
    ): Promise<BankConfigResponseDto> {
        const config = await this.updateBankConfigService.execute({
            id: BigInt(id),
            ...dto,
        });
        return this.toBankResponse(config);
    }

    @ApiOperation({ summary: '은행 출금 설정 활성/비활성 토글' })
    @Patch('bank/:id/active')
    async toggleBankConfigActive(
        @Param('id') id: string,
    ): Promise<BankConfigResponseDto> {
        const config = await this.toggleBankConfigActiveService.execute(BigInt(id));
        return this.toBankResponse(config);
    }

    @ApiOperation({ summary: '은행 출금 설정 삭제' })
    @Delete('bank/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteBankConfig(
        @Param('id') id: string,
    ): Promise<void> {
        await this.deleteBankConfigService.execute(BigInt(id));
    }

    // ===== Helpers =====

    private toCryptoResponse(config: CryptoWithdrawConfig): CryptoConfigResponseDto {
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

    private toBankResponse(config: BankWithdrawConfig): BankConfigResponseDto {
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
