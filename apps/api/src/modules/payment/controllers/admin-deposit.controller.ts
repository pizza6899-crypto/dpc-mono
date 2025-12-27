import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { SessionAuthGuard } from 'src/platform/auth/guards/session-auth.guard';
import { RequireRoles } from 'src/platform/auth/decorators/roles.decorator';
import { Prisma, UserRoleType } from '@prisma/client';
import {
  ApiStandardResponse,
  ApiStandardErrors,
  ApiPaginatedResponse,
} from 'src/platform/http/decorators/api-response.decorator';
import { CurrentUser } from 'src/platform/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/platform/auth/decorators/current-user.decorator';
import { RequestClienttInfo } from 'src/platform/auth/decorators/request-info.decorator';
import type { PaginatedData, RequestClientInfo } from 'src/platform/http/types';
import { Paginated } from 'src/platform/http/decorators/paginated.decorator';
import { AdminDepositService } from '../application/admin-deposit.service';
import { GetDepositsQueryDto } from '../dtos/get-deposits-query.dto';
import { ApproveBankDepositDto } from '../dtos/approve-bank-deposit.dto';
import { RejectDepositDto } from '../dtos/reject-deposit.dto';
import {
  AdminDepositListItemDto,
  ApproveDepositResponseDto,
  RejectDepositResponseDto,
} from '../dtos/admin-deposit-response.dto';

@Controller('admin/payment/deposits')
@ApiTags('Admin Deposit Management (관리자 입금 관리)')
@ApiStandardErrors()
@UseGuards(SessionAuthGuard)
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class AdminDepositController {
  constructor(private readonly adminDepositService: AdminDepositService) {}

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
  async getDeposits(
    @Query() query: GetDepositsQueryDto,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClienttInfo() requestInfo: RequestClientInfo,
  ): Promise<PaginatedData<AdminDepositListItemDto>> {
    return await this.adminDepositService.getDeposits(
      query,
      admin.id,
      requestInfo,
    );
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
  async approveDeposit(
    @Param('id') id: string,
    @Body() dto: ApproveBankDepositDto,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClienttInfo() requestInfo: RequestClientInfo,
  ) {
    return await this.adminDepositService.approveDeposit(
      BigInt(id),
      new Prisma.Decimal(dto.actuallyPaid),
      dto.transactionHash,
      dto.memo,
      admin.id,
      requestInfo,
    );
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
  async rejectDeposit(
    @Param('id') id: string,
    @Body() failureReason: RejectDepositDto,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClienttInfo() requestInfo: RequestClientInfo,
  ) {
    return await this.adminDepositService.rejectDeposit(
      BigInt(id),
      failureReason.failureReason,
      admin.id,
      requestInfo,
    );
  }
}
