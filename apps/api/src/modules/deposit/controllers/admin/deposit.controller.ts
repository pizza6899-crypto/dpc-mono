import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  NotImplementedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType, Prisma } from '@repo/database';
import {
  ApiStandardResponse,
  ApiStandardErrors,
  ApiPaginatedResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import type { PaginatedData, RequestClientInfo } from 'src/common/http/types';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { GetDepositsQueryDto } from './dto/request/get-deposits-query.dto';
import { ApproveBankDepositDto } from './dto/request/approve-bank-deposit.dto';
import { RejectDepositDto } from './dto/request/reject-deposit.dto';
import {
  AdminDepositListItemDto,
  ApproveDepositResponseDto,
  RejectDepositResponseDto,
} from './dto/response/deposit.response.dto';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { GetDepositStatsService } from '../../application/get-deposit-stats.service';
import { GetDepositsService } from '../../application/get-deposits.service';
import { GetDepositDetailService } from '../../application/get-deposit-detail.service';
import { ApproveDepositService } from '../../application/approve-deposit.service';
import { RejectDepositService } from '../../application/reject-deposit.service';
import { FindBankConfigsAdminService } from '../../application/find-bank-configs-admin.service';
import { GetBankConfigAdminService } from '../../application/get-bank-config-admin.service';
import { UpdateBankConfigAdminService } from '../../application/update-bank-config-admin.service';
import { DeleteBankConfigAdminService } from '../../application/delete-bank-config-admin.service';
import { FindCryptoConfigsAdminService } from '../../application/find-crypto-configs-admin.service';
import { GetCryptoConfigAdminService } from '../../application/get-crypto-config-admin.service';
import { CreateCryptoConfigService } from '../../application/create-crypto-config.service';
import { UpdateCryptoConfigAdminService } from '../../application/update-crypto-config-admin.service';
import { DeleteCryptoConfigAdminService } from '../../application/delete-crypto-config-admin.service';
import { CreateBankConfigService } from '../../application/create-bank-config.service';
import {
  CreateBankConfigRequestDto,
  UpdateBankConfigRequestDto,
  GetBankConfigsQueryDto,
} from './dto/request/bank-config.request.dto';
import { BankConfigResponseDto } from './dto/response/bank-config.response.dto';
import {
  CreateCryptoConfigRequestDto,
  UpdateCryptoConfigRequestDto,
  GetCryptoConfigsQueryDto,
} from './dto/request/crypto-config.request.dto';
import { CryptoConfigResponseDto } from './dto/response/crypto-config.response.dto';
import { DepositStatsResponseDto } from './dto/response/deposit-stats.response.dto';
import { SuccessResponseDto } from 'src/common/dtos/success-response.dto';

@Controller('admin/deposits')
@ApiTags('Admin Deposit Management')
@ApiStandardErrors()
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class AdminDepositController {
  constructor(
    private readonly getDepositStatsService: GetDepositStatsService,
    private readonly getDepositsService: GetDepositsService,
    private readonly getDepositDetailService: GetDepositDetailService,
    private readonly approveDepositService: ApproveDepositService,
    private readonly rejectDepositService: RejectDepositService,
    private readonly findBankConfigsAdminService: FindBankConfigsAdminService,
    private readonly getBankConfigAdminService: GetBankConfigAdminService,
    private readonly updateBankConfigAdminService: UpdateBankConfigAdminService,
    private readonly deleteBankConfigAdminService: DeleteBankConfigAdminService,
    private readonly findCryptoConfigsAdminService: FindCryptoConfigsAdminService,
    private readonly getCryptoConfigAdminService: GetCryptoConfigAdminService,
    private readonly createCryptoConfigService: CreateCryptoConfigService,
    private readonly updateCryptoConfigAdminService: UpdateCryptoConfigAdminService,
    private readonly deleteCryptoConfigAdminService: DeleteCryptoConfigAdminService,
    private readonly createBankConfigService: CreateBankConfigService,
  ) { }
  // ============================================
  // 입금 관리 (Deposit Management)
  // ============================================

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get deposit statistics / 입금 현황 요약',
    description:
      'Get real-time deposit statistics including total deposit amount today, pending requests count, and method distribution. (실시간 입금 현황 요약: 오늘 총 입금액, 대기 중인 요청 수, 수단별 점유율을 조회합니다.)',
  })
  @ApiStandardResponse(DepositStatsResponseDto, {
    status: 200,
    description: 'Deposit statistics retrieved successfully / 입금 현황 요약 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_DEPOSIT_STATS',
    category: 'DEPOSIT',
  })
  async getDepositStats(
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<DepositStatsResponseDto> {
    return await this.getDepositStatsService.execute();
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @ApiOperation({
    summary: 'Get deposit list / 입금 목록 조회',
    description:
      'Retrieve deposit history with pagination and filtering support. (관리자가 입금 내역을 조회합니다. 페이징 및 필터링을 지원합니다.)',
  })
  @ApiPaginatedResponse(AdminDepositListItemDto, {
    status: 200,
    description: 'Deposit list retrieved successfully / 입금 목록 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_DEPOSIT_LIST',
    category: 'DEPOSIT',
  })
  async getDeposits(
    @Query() query: GetDepositsQueryDto,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<PaginatedData<AdminDepositListItemDto>> {
    const result = await this.getDepositsService.execute({
      query: {
        skip: ((query.page || 1) - 1) * (query.limit || 20),
        take: query.limit || 20,
        status: query.status,
        methodType: query.methodType,
        userId: query.userId,
        currency: query.currency,
        startDate: query.startDate,
        endDate: query.endDate,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    });
    return {
      data: result.data.map((item) => ({
        id: item.deposit.id!.toString(),
        userId: item.deposit.userId,
        userEmail: item.userEmail || '',
        status: item.deposit.status,
        methodType: item.deposit.getMethod().methodType,
        provider: item.deposit.getMethod().provider,
        depositCurrency: item.deposit.depositCurrency,
        createdAt: item.deposit.createdAt,
        updatedAt: item.deposit.updatedAt,
        failureReason: item.deposit.failureReason || '',
      })),
      page: result.page,
      limit: result.limit,
      total: result.total,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get deposit detail / 입금 상세 조회',
    description:
      'Retrieve detailed information of a specific deposit. (특정 입금의 상세 정보를 조회합니다.)',
  })
  @ApiParam({
    name: 'id',
    description: 'DepositDetail ID / 입금 상세 ID',
    type: String,
  })
  @ApiStandardResponse(AdminDepositListItemDto, {
    status: 200,
    description: 'Deposit detail retrieved successfully / 입금 상세 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_DEPOSIT_DETAIL',
    category: 'DEPOSIT',
    extractMetadata: (_, args) => ({
      depositId: args[0]?.id || args[0],
    }),
  })
  async getDepositDetail(
    @Param('id') id: string,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<AdminDepositListItemDto> {
    const result = await this.getDepositDetailService.execute({
      id: BigInt(id),
    });
    return {
      id: result.deposit.id!.toString(),
      userId: result.deposit.userId,
      userEmail: result.userEmail || '',
      status: result.deposit.status,
      methodType: result.deposit.getMethod().methodType,
      provider: result.deposit.getMethod().provider,
      depositCurrency: result.deposit.depositCurrency,
      createdAt: result.deposit.createdAt,
      updatedAt: result.deposit.updatedAt,
      failureReason: result.deposit.failureReason || '',
    };
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve deposit / 입금 승인',
    description:
      'Approve a deposit and update user balance. (관리자가 입금을 승인하고 잔액을 업데이트합니다.)',
  })
  @ApiParam({
    name: 'id',
    description: 'DepositDetail ID / 입금 상세 ID',
    type: String,
  })
  @ApiStandardResponse(ApproveDepositResponseDto, {
    status: 200,
    description: 'Deposit approved successfully / 입금 승인 성공',
  })
  @AuditLog({
    type: LogType.AUTH,
    action: 'APPROVE_DEPOSIT',
    category: 'DEPOSIT',
    extractMetadata: (_, args) => ({
      depositId: args[0]?.id || args[0],
      actuallyPaid: args[1]?.actuallyPaid,
      transactionHash: args[1]?.transactionHash,
    }),
  })
  async approveDeposit(
    @Param('id') id: string,
    @Body() dto: ApproveBankDepositDto,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<ApproveDepositResponseDto> {
    return await this.approveDepositService.execute({
      id: BigInt(id),
      actuallyPaid: new Prisma.Decimal(dto.actuallyPaid),
      transactionHash: dto.transactionHash,
      memo: dto.memo,
      adminId: admin.id,
      requestInfo,
    });
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject deposit / 입금 거부',
    description: 'Reject a deposit request. (관리자가 입금을 거부합니다.)',
  })
  @ApiParam({
    name: 'id',
    description: 'DepositDetail ID / 입금 상세 ID',
    type: String,
  })
  @ApiStandardResponse(RejectDepositResponseDto, {
    status: 200,
    description: 'Deposit rejected successfully / 입금 거부 성공',
  })
  @AuditLog({
    type: LogType.AUTH,
    action: 'REJECT_DEPOSIT',
    category: 'DEPOSIT',
    extractMetadata: (_, args) => ({
      depositId: args[0]?.id || args[0],
      failureReason: args[1]?.failureReason,
    }),
  })
  async rejectDeposit(
    @Param('id') id: string,
    @Body() dto: RejectDepositDto,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<RejectDepositResponseDto> {
    return await this.rejectDepositService.execute({
      id: BigInt(id),
      failureReason: dto.failureReason,
      adminId: admin.id,
    });
  }

  // ============================================
  // 은행 계좌 관리 (Bank Config Management)
  // ============================================

  @Get('configs/bank')
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @ApiOperation({
    summary: 'Get bank config list / 은행 계좌 목록 조회',
    description:
      'Retrieve list of bank account configurations. (은행 계좌 설정 목록을 조회합니다.)',
  })
  @ApiPaginatedResponse(BankConfigResponseDto, {
    status: 200,
    description: 'Bank config list retrieved successfully / 은행 계좌 목록 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_BANK_CONFIG_LIST',
    category: 'DEPOSIT',
  })
  async getBankConfigs(
    @Query() query: GetBankConfigsQueryDto,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<PaginatedData<BankConfigResponseDto>> {
    const result = await this.findBankConfigsAdminService.execute(query);
    return {
      ...result,
      data: result.data.map(config => this.toBankConfigResponseDto(config)),
    };
  }

  @Post('configs/bank')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create bank config / 은행 계좌 등록',
    description:
      'Register a new bank account configuration. (새로운 은행 계좌 설정을 등록합니다.)',
  })
  @ApiStandardResponse(BankConfigResponseDto, {
    status: 201,
    description: 'Bank config created successfully / 은행 계좌 등록 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'CREATE_BANK_CONFIG',
    category: 'DEPOSIT',
    extractMetadata: (_, args) => ({
      currency: args[0]?.currency,
      bankName: args[0]?.bankName,
    }),
  })
  async createBankConfig(
    @Body() dto: CreateBankConfigRequestDto,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<BankConfigResponseDto> {
    const config = await this.createBankConfigService.execute(dto);

    return {
      id: config.id!.toString(),
      uid: config.uid!,
      currency: config.currency,
      bankName: config.bankName,
      accountNumber: config.accountNumber,
      accountHolder: config.accountHolder,
      isActive: config.isActive,
      priority: config.priority,
      description: config.description,
      notes: config.notes,
      minAmount: config.minAmount.toString(),
      maxAmount: config.maxAmount?.toString() ?? null,
      totalDeposits: config.totalDeposits,
      totalDepositAmount: config.totalDepositAmount.toString(),
      createdAt: config.createdAt!,
      updatedAt: config.updatedAt!,
    };
  }

  @Get('configs/bank/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get bank config detail / 은행 계좌 상세 조회',
    description:
      'Retrieve detailed information of a specific bank config. (특정 은행 계좌 설정의 상세 정보를 조회합니다.)',
  })
  @ApiParam({
    name: 'id',
    description: 'BankConfig ID / 은행 계좌 설정 ID',
    type: String,
  })
  @ApiStandardResponse(BankConfigResponseDto, {
    status: 200,
    description: 'Bank config detail retrieved successfully / 은행 계좌 상세 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_BANK_CONFIG_DETAIL',
    category: 'DEPOSIT',
    extractMetadata: (_, args) => ({
      bankConfigId: args[0]?.id || args[0],
    }),
  })
  async getBankConfigDetail(
    @Param('id') id: string,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<BankConfigResponseDto> {
    const config = await this.getBankConfigAdminService.execute({ id: BigInt(id) });
    return this.toBankConfigResponseDto(config);
  }

  @Patch('configs/bank/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update bank config / 은행 계좌 수정',
    description:
      'Update a bank account configuration. (은행 계좌 설정을 수정합니다.)',
  })
  @ApiParam({
    name: 'id',
    description: 'BankConfig ID / 은행 계좌 설정 ID',
    type: String,
  })
  @ApiStandardResponse(BankConfigResponseDto, {
    status: 200,
    description: 'Bank config updated successfully / 은행 계좌 수정 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'UPDATE_BANK_CONFIG',
    category: 'DEPOSIT',
    extractMetadata: (_, args) => ({
      bankConfigId: args[0]?.id || args[0],
      updatedFields: Object.keys(args[1] || {}),
    }),
  })
  async updateBankConfig(
    @Param('id') id: string,
    @Body() dto: UpdateBankConfigRequestDto,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<BankConfigResponseDto> {
    const config = await this.updateBankConfigAdminService.execute({
      id: BigInt(id),
      ...dto
    });
    return this.toBankConfigResponseDto(config);
  }

  @Delete('configs/bank/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete bank config / 은행 계좌 삭제',
    description:
      'Soft delete a bank account configuration. (은행 계좌 설정을 소프트 삭제합니다.)',
  })
  @ApiParam({
    name: 'id',
    description: 'BankConfig ID / 은행 계좌 설정 ID',
    type: String,
  })
  @ApiStandardResponse(SuccessResponseDto, {
    status: 200,
    description: 'Bank config deleted successfully / 은행 계좌 삭제 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'DELETE_BANK_CONFIG',
    category: 'DEPOSIT',
    extractMetadata: (_, args) => ({
      bankConfigId: args[0]?.id || args[0],
    }),
  })
  async deleteBankConfig(
    @Param('id') id: string,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<SuccessResponseDto> {
    await this.deleteBankConfigAdminService.execute({ id: BigInt(id) });
    return { success: true };
  }

  // ============================================
  // 암호화폐 설정 관리 (Crypto Config Management)
  // ============================================

  @Get('configs/crypto')
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @ApiOperation({
    summary: 'Get crypto config list / 암호화폐 설정 목록 조회',
    description:
      'Retrieve list of cryptocurrency configurations. (암호화폐 설정 목록을 조회합니다.)',
  })
  @ApiPaginatedResponse(CryptoConfigResponseDto, {
    status: 200,
    description: 'Crypto config list retrieved successfully / 암호화폐 설정 목록 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_CRYPTO_CONFIG_LIST',
    category: 'DEPOSIT',
  })
  async getCryptoConfigs(
    @Query() query: GetCryptoConfigsQueryDto,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<PaginatedData<CryptoConfigResponseDto>> {
    const paginated = await this.findCryptoConfigsAdminService.execute(query);
    return {
      ...paginated,
      data: paginated.data.map(config => this.toCryptoConfigResponseDto(config)),
    };
  }

  @Get('configs/crypto/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get crypto config detail / 암호화폐 설정 상세 조회',
    description:
      'Retrieve detailed information of a specific crypto config. (특정 암호화폐 설정의 상세 정보를 조회합니다.)',
  })
  @ApiParam({
    name: 'id',
    description: 'CryptoConfig ID / 암호화폐 설정 ID',
    type: String,
  })
  @ApiStandardResponse(CryptoConfigResponseDto, {
    status: 200,
    description: 'Crypto config detail retrieved successfully / 암호화폐 설정 상세 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_CRYPTO_CONFIG_DETAIL',
    category: 'DEPOSIT',
    extractMetadata: (_, args) => ({
      cryptoConfigId: args[0]?.id || args[0],
    }),
  })
  async getCryptoConfigDetail(
    @Param('id') id: string,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<CryptoConfigResponseDto> {
    const config = await this.getCryptoConfigAdminService.execute({ id: BigInt(id) });
    return this.toCryptoConfigResponseDto(config);
  }

  @Patch('configs/crypto/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update crypto config / 암호화폐 설정 수정',
    description:
      'Update a cryptocurrency configuration. (암호화폐 설정을 수정합니다.)',
  })
  @ApiParam({
    name: 'id',
    description: 'CryptoConfig ID / 암호화폐 설정 ID',
    type: String,
  })
  @ApiStandardResponse(CryptoConfigResponseDto, {
    status: 200,
    description: 'Crypto config updated successfully / 암호화폐 설정 수정 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'UPDATE_CRYPTO_CONFIG',
    category: 'DEPOSIT',
    extractMetadata: (_, args) => ({
      cryptoConfigId: args[0]?.id || args[0],
      updatedFields: Object.keys(args[1] || {}),
    }),
  })
  async updateCryptoConfig(
    @Param('id') id: string,
    @Body() dto: UpdateCryptoConfigRequestDto,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<CryptoConfigResponseDto> {
    const config = await this.updateCryptoConfigAdminService.execute({
      id: BigInt(id),
      ...dto
    });
    return this.toCryptoConfigResponseDto(config);
  }

  @Post('configs/crypto')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create crypto config / 암호화폐 설정 생성',
    description:
      'Create a new cryptocurrency configuration. (새로운 암호화폐 설정을 생성합니다.)',
  })
  @ApiStandardResponse(CryptoConfigResponseDto, {
    status: 201,
    description: 'Crypto config created successfully / 암호화폐 설정 생성 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'CREATE_CRYPTO_CONFIG',
    category: 'DEPOSIT',
    extractMetadata: (_, args) => ({
      symbol: args[0]?.symbol,
      network: args[0]?.network,
    }),
  })
  async createCryptoConfig(
    @Body() dto: CreateCryptoConfigRequestDto,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<CryptoConfigResponseDto> {
    const config = await this.createCryptoConfigService.execute(dto);
    return this.toCryptoConfigResponseDto(config);
  }

  @Delete('configs/crypto/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete crypto config / 암호화폐 설정 삭제',
    description:
      'Delete a cryptocurrency configuration. (암호화폐 설정을 삭제합니다.)',
  })
  @ApiParam({
    name: 'id',
    description: 'CryptoConfig ID / 암호화폐 설정 ID',
    type: String,
  })
  @ApiStandardResponse(SuccessResponseDto, {
    status: 200,
    description: 'Crypto config deleted successfully / 암호화폐 설정 삭제 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'DELETE_CRYPTO_CONFIG',
    category: 'DEPOSIT',
    extractMetadata: (_, args) => ({
      cryptoConfigId: args[0]?.id || args[0],
    }),
  })
  async deleteCryptoConfig(
    @Param('id') id: string,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<SuccessResponseDto> {
    await this.deleteCryptoConfigAdminService.execute({ id: BigInt(id) });
    return { success: true };
  }

  private toCryptoConfigResponseDto(config: any): CryptoConfigResponseDto {
    return {
      id: config.id.toString(),
      uid: config.uid,
      symbol: config.symbol,
      network: config.network,
      isActive: config.isActive,
      minDepositAmount: config.minDepositAmount.toString(),
      depositFeeRate: config.depositFeeRate.toString(),
      confirmations: config.confirmations,
      contractAddress: config.contractAddress,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  private toBankConfigResponseDto(config: any): BankConfigResponseDto {
    return {
      id: config.id.toString(),
      uid: config.uid,
      currency: config.currency,
      bankName: config.bankName,
      accountNumber: config.accountNumber,
      accountHolder: config.accountHolder,
      isActive: config.isActive,
      priority: config.priority,
      description: config.description,
      notes: config.notes,
      minAmount: config.minAmount.toString(),
      maxAmount: config.maxAmount?.toString() ?? null,
      totalDeposits: config.totalDeposits,
      totalDepositAmount: config.totalDepositAmount.toString(),
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }
}

