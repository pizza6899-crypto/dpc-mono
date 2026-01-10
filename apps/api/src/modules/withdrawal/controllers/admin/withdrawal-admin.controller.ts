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
    ApiQuery,
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
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType, WithdrawalStatus } from '@repo/database';
import {
    ApproveWithdrawalService,
    RejectWithdrawalService,
    FindPendingWithdrawalsService,
    GetWithdrawalService,
} from '../../application';
import {
    ApproveWithdrawalDto,
    RejectWithdrawalDto,
    AdminWithdrawalResponseDto,
    ApproveWithdrawalResponseDto,
    RejectWithdrawalResponseDto,
} from './dto';

@ApiTags('Admin Withdrawal')
@Controller('admin/withdrawals')
@ApiBearerAuth()
@ApiStandardErrors()
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class WithdrawalAdminController {
    constructor(
        private readonly approveWithdrawalService: ApproveWithdrawalService,
        private readonly rejectWithdrawalService: RejectWithdrawalService,
        private readonly findPendingWithdrawalsService: FindPendingWithdrawalsService,
        private readonly getWithdrawalService: GetWithdrawalService,
    ) { }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get pending withdrawals',
        description: 'Retrieve list of withdrawals pending review.',
    })
    @ApiQuery({
        name: 'status',
        required: false,
        enum: WithdrawalStatus,
        description: 'Filter by status (default: PENDING_REVIEW)',
    })
    @ApiStandardResponse(AdminWithdrawalResponseDto, {
        status: 200,
        description: 'Pending withdrawals retrieved successfully',
        isArray: true,
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'VIEW_PENDING_WITHDRAWALS',
        category: 'WITHDRAWAL',
    })
    async getPendingWithdrawals(
        @Query('status') status?: WithdrawalStatus,
        @CurrentUser() admin?: CurrentUserWithSession,
        @RequestClientInfoParam() requestInfo?: RequestClientInfo,
    ): Promise<{ withdrawals: AdminWithdrawalResponseDto[] }> {
        const result = await this.findPendingWithdrawalsService.execute({
            status: status ?? WithdrawalStatus.PENDING_REVIEW,
        });

        return {
            withdrawals: result.withdrawals.map(AdminWithdrawalResponseDto.fromDomain),
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
    @ApiStandardResponse(AdminWithdrawalResponseDto, {
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
        @CurrentUser() admin: CurrentUserWithSession,
        @RequestClientInfoParam() requestInfo: RequestClientInfo,
    ): Promise<AdminWithdrawalResponseDto> {
        // Admin can view any withdrawal
        const withdrawal = await this.getWithdrawalService.execute({
            userId: admin.id, // Will be bypassed in admin context
            withdrawalId: BigInt(id),
        });
        return AdminWithdrawalResponseDto.fromDomain(withdrawal);
    }

    @Post(':id/approve')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Approve withdrawal',
        description: 'Approve a pending withdrawal request.',
    })
    @ApiParam({
        name: 'id',
        description: 'Withdrawal ID',
        type: String,
    })
    @ApiStandardResponse(ApproveWithdrawalResponseDto, {
        status: 200,
        description: 'Withdrawal approved successfully',
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'APPROVE_WITHDRAWAL',
        category: 'WITHDRAWAL',
        extractMetadata: (_, args) => ({
            withdrawalId: args[0],
            note: args[1]?.note,
        }),
    })
    async approveWithdrawal(
        @Param('id') id: string,
        @Body() dto: ApproveWithdrawalDto,
        @CurrentUser() admin: CurrentUserWithSession,
        @RequestClientInfoParam() requestInfo: RequestClientInfo,
    ): Promise<ApproveWithdrawalResponseDto> {
        const result = await this.approveWithdrawalService.execute({
            withdrawalId: BigInt(id),
            adminId: admin.id,
            note: dto.note,
        });

        return {
            withdrawalId: result.withdrawalId.toString(),
            status: result.status,
            processedBy: result.processedBy.toString(),
        };
    }

    @Post(':id/reject')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Reject withdrawal',
        description: 'Reject a pending withdrawal request.',
    })
    @ApiParam({
        name: 'id',
        description: 'Withdrawal ID',
        type: String,
    })
    @ApiStandardResponse(RejectWithdrawalResponseDto, {
        status: 200,
        description: 'Withdrawal rejected successfully',
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'REJECT_WITHDRAWAL',
        category: 'WITHDRAWAL',
        extractMetadata: (_, args) => ({
            withdrawalId: args[0],
            reason: args[1]?.reason,
        }),
    })
    async rejectWithdrawal(
        @Param('id') id: string,
        @Body() dto: RejectWithdrawalDto,
        @CurrentUser() admin: CurrentUserWithSession,
        @RequestClientInfoParam() requestInfo: RequestClientInfo,
    ): Promise<RejectWithdrawalResponseDto> {
        const result = await this.rejectWithdrawalService.execute({
            withdrawalId: BigInt(id),
            adminId: admin.id,
            reason: dto.reason,
        });

        return {
            withdrawalId: result.withdrawalId.toString(),
            status: result.status,
            processedBy: result.processedBy.toString(),
            reason: result.reason,
        };
    }
}
