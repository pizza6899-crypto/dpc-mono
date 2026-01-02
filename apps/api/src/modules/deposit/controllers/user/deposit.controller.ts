// src/modules/deposit/controllers/user/deposit.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Delete,
  HttpCode,
  HttpStatus,
  NotImplementedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
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
import { CreateDepositResponseDto } from '../../dtos/create-deposit-response.dto';
import { CreateDepositRequestDto } from '../../dtos/create-deposit-request.dto';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { GetAvailableDepositMethodsService } from '../../application/get-available-deposit-methods.service';

@ApiTags('입금 (Deposit)')
@Controller('deposits')
@ApiBearerAuth()
@ApiStandardErrors()
export class DepositController {
  constructor(
    private readonly getAvailableMethodsService: GetAvailableDepositMethodsService,
  ) { }

  // ============================================
  // 입금 수단 조회
  // ============================================

  @Get('methods')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get available deposit methods / 사용 가능한 입금 수단 조회',
    description:
      'Retrieve list of available deposit methods (crypto, bank transfer). (사용 가능한 입금 수단 목록을 조회합니다.)',
  })
  @ApiStandardResponse(Object, {
    status: 200,
    description: 'Deposit methods retrieved successfully / 입금 수단 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_DEPOSIT_METHODS',
    category: 'DEPOSIT',
  })
  async getAvailableMethods(
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ) {
    return this.getAvailableMethodsService.execute();
  }

  // ============================================
  // 입금 주소 요청
  // ============================================

  @Get('crypto/address')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get crypto deposit address / 암호화폐 입금 주소 요청',
    description:
      'Request a cryptocurrency deposit address for the specified currency and network. (지정된 통화 및 네트워크에 대한 암호화폐 입금 주소를 요청합니다.)',
  })
  @ApiStandardResponse(Object, {
    status: 200,
    description: 'Crypto deposit address retrieved successfully / 암호화폐 입금 주소 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'REQUEST_CRYPTO_DEPOSIT_ADDRESS',
    category: 'DEPOSIT',
    extractMetadata: (args) => ({
      currency: args[0]?.currency,
      network: args[0]?.network,
    }),
  })
  async getCryptoDepositAddress(
    @Query('currency') currency: string,
    @Query('network') network: string,
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ) {
    throw new NotImplementedException('서비스 구현 필요');
  }

  @Get('bank/address')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get bank deposit account / 계좌 이체 입금 계좌 정보 요청',
    description:
      'Request bank account information for bank transfer deposit. (계좌 이체 입금을 위한 은행 계좌 정보를 요청합니다.)',
  })
  @ApiStandardResponse(Object, {
    status: 200,
    description: 'Bank deposit account retrieved successfully / 계좌 이체 입금 계좌 정보 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'REQUEST_BANK_DEPOSIT_ADDRESS',
    category: 'DEPOSIT',
    extractMetadata: (args) => ({
      currency: args[0]?.currency,
    }),
  })
  async getBankDepositAddress(
    @Query('currency') currency: string,
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ) {
    throw new NotImplementedException('서비스 구현 필요');
  }

  // ============================================
  // 입금 관리
  // ============================================

  @Get()
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @ApiOperation({
    summary: 'Get my deposit list / 내 입금 목록 조회',
    description:
      'Retrieve my deposit history with pagination. (내 입금 내역을 페이징하여 조회합니다.)',
  })
  @ApiPaginatedResponse(Object, {
    status: 200,
    description: 'Deposit list retrieved successfully / 입금 목록 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_MY_DEPOSIT_LIST',
    category: 'DEPOSIT',
  })
  async getMyDeposits(
    @Query() query: any,
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<PaginatedData<any>> {
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
  @ApiStandardResponse(Object, {
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
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ) {
    throw new NotImplementedException('서비스 구현 필요');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create deposit request / 입금 요청 생성',
    description:
      'Create a new deposit request. (새로운 입금 요청을 생성합니다.)',
  })
  @ApiStandardResponse(CreateDepositResponseDto, {
    status: 201,
    description: 'Deposit request created successfully / 입금 요청 생성 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'CREATE_DEPOSIT_REQUEST',
    category: 'DEPOSIT',
    extractMetadata: (args) => ({
      methodType: args[0]?.methodType,
      currency: args[0]?.payCurrency,
      amount: args[0]?.amount,
    }),
  })
  async createDeposit(
    @Body() createDepositRequest: CreateDepositRequestDto,
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClientInfoParam() clientInfo: RequestClientInfo,
  ): Promise<CreateDepositResponseDto> {
    throw new NotImplementedException('서비스 구현 필요');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel deposit request / 입금 신청 취소',
    description:
      'Cancel a pending deposit request. (대기 중인 입금 요청을 취소합니다.)',
  })
  @ApiParam({
    name: 'id',
    description: 'DepositDetail ID / 입금 상세 ID',
    type: String,
  })
  @ApiStandardResponse(Object, {
    status: 200,
    description: 'Deposit request cancelled successfully / 입금 신청 취소 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'CANCEL_DEPOSIT_REQUEST',
    category: 'DEPOSIT',
    extractMetadata: (args) => ({
      depositId: args[0]?.id || args[0],
    }),
  })
  async cancelDeposit(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ) {
    throw new NotImplementedException('서비스 구현 필요');
  }
}

