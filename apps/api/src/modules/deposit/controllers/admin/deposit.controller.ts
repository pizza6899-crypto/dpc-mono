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
import { UserRoleType } from '@repo/database';
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
import { GetDepositsQueryDto } from '../../dtos/get-deposits-query.dto';
import { ApproveBankDepositDto } from '../../dtos/approve-bank-deposit.dto';
import { RejectDepositDto } from '../../dtos/reject-deposit.dto';
import {
  AdminDepositListItemDto,
  ApproveDepositResponseDto,
  RejectDepositResponseDto,
} from '../../dtos/admin-deposit-response.dto';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';

@Controller('admin/deposits')
@ApiTags('Admin Deposit Management (관리자 입금 관리)')
@ApiStandardErrors()
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class AdminDepositController {
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
  @ApiStandardResponse(Object, {
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
  ) {
    throw new NotImplementedException('서비스 구현 필요');
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
    throw new NotImplementedException('서비스 구현 필요');
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
    extractMetadata: (args) => ({
      depositId: args[0]?.id || args[0],
    }),
  })
  async getDepositDetail(
    @Param('id') id: string,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ) {
    throw new NotImplementedException('서비스 구현 필요');
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
    extractMetadata: (args) => ({
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
  ) {
    throw new NotImplementedException('서비스 구현 필요');
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
    extractMetadata: (args) => ({
      depositId: args[0]?.id || args[0],
      failureReason: args[1]?.failureReason,
    }),
  })
  async rejectDeposit(
    @Param('id') id: string,
    @Body() dto: RejectDepositDto,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ) {
    throw new NotImplementedException('서비스 구현 필요');
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
  @ApiPaginatedResponse(Object, {
    status: 200,
    description: 'Bank config list retrieved successfully / 은행 계좌 목록 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_BANK_CONFIG_LIST',
    category: 'DEPOSIT',
  })
  async getBankConfigs(
    @Query() query: any,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ) {
    throw new NotImplementedException('서비스 구현 필요');
  }

  @Post('configs/bank')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create bank config / 은행 계좌 등록',
    description:
      'Register a new bank account configuration. (새로운 은행 계좌 설정을 등록합니다.)',
  })
  @ApiStandardResponse(Object, {
    status: 201,
    description: 'Bank config created successfully / 은행 계좌 등록 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'CREATE_BANK_CONFIG',
    category: 'DEPOSIT',
    extractMetadata: (args) => ({
      currency: args[0]?.currency,
      bankName: args[0]?.bankName,
    }),
  })
  async createBankConfig(
    @Body() dto: any,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ) {
    throw new NotImplementedException('서비스 구현 필요');
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
  @ApiStandardResponse(Object, {
    status: 200,
    description: 'Bank config detail retrieved successfully / 은행 계좌 상세 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_BANK_CONFIG_DETAIL',
    category: 'DEPOSIT',
    extractMetadata: (args) => ({
      bankConfigId: args[0]?.id || args[0],
    }),
  })
  async getBankConfigDetail(
    @Param('id') id: string,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ) {
    throw new NotImplementedException('서비스 구현 필요');
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
  @ApiStandardResponse(Object, {
    status: 200,
    description: 'Bank config updated successfully / 은행 계좌 수정 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'UPDATE_BANK_CONFIG',
    category: 'DEPOSIT',
    extractMetadata: (args) => ({
      bankConfigId: args[0]?.id || args[0],
      updatedFields: Object.keys(args[1] || {}),
    }),
  })
  async updateBankConfig(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ) {
    throw new NotImplementedException('서비스 구현 필요');
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
  @ApiStandardResponse(Object, {
    status: 200,
    description: 'Bank config deleted successfully / 은행 계좌 삭제 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'DELETE_BANK_CONFIG',
    category: 'DEPOSIT',
    extractMetadata: (args) => ({
      bankConfigId: args[0]?.id || args[0],
    }),
  })
  async deleteBankConfig(
    @Param('id') id: string,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ) {
    throw new NotImplementedException('서비스 구현 필요');
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
  @ApiPaginatedResponse(Object, {
    status: 200,
    description: 'Crypto config list retrieved successfully / 암호화폐 설정 목록 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_CRYPTO_CONFIG_LIST',
    category: 'DEPOSIT',
  })
  async getCryptoConfigs(
    @Query() query: any,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ) {
    throw new NotImplementedException('서비스 구현 필요');
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
  @ApiStandardResponse(Object, {
    status: 200,
    description: 'Crypto config detail retrieved successfully / 암호화폐 설정 상세 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_CRYPTO_CONFIG_DETAIL',
    category: 'DEPOSIT',
    extractMetadata: (args) => ({
      cryptoConfigId: args[0]?.id || args[0],
    }),
  })
  async getCryptoConfigDetail(
    @Param('id') id: string,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ) {
    throw new NotImplementedException('서비스 구현 필요');
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
  @ApiStandardResponse(Object, {
    status: 200,
    description: 'Crypto config updated successfully / 암호화폐 설정 수정 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'UPDATE_CRYPTO_CONFIG',
    category: 'DEPOSIT',
    extractMetadata: (args) => ({
      cryptoConfigId: args[0]?.id || args[0],
      updatedFields: Object.keys(args[1] || {}),
    }),
  })
  async updateCryptoConfig(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ) {
    throw new NotImplementedException('서비스 구현 필요');
  }
}

