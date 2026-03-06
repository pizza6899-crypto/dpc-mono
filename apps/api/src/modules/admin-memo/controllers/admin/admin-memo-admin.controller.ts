import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { CreateAdminMemoService } from '../../application/create-admin-memo.service';
import { FindAdminMemoService } from '../../application/find-admin-memo.service';
import { CreateAdminMemoDto } from './dto/request/create-admin-memo.dto';
import { FindAdminMemosQueryDto } from './dto/request/find-admin-memos.dto';
import { AdminMemoResponseDto } from './dto/response/admin-memo.response.dto';

@Controller('admin/memos')
@ApiTags('Admin Memos')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class AdminMemoAdminController {
    constructor(
        private readonly createAdminMemoService: CreateAdminMemoService,
        private readonly findAdminMemoService: FindAdminMemoService,
    ) { }

    @Post()
    @ApiOperation({
        summary: 'Create admin memo / 관리자 메모 생성',
        description: 'Create a new memo for an admin or associate it with a domain (e.g., Deposit). / 새로운 관리자 메모를 생성하거나 특정 도메인(예: 입금)에 연결합니다.',
    })
    @ApiStandardResponse(AdminMemoResponseDto, {
        status: 201,
        description: 'Memo created successfully / 메모 생성 성공',
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'ADMIN_MEMO',
        action: 'CREATE_MEMO',
        extractMetadata: (result) => ({
            id: result.id,
            targetType: result.targetType,
            targetId: result.targetId,
        }),
    })
    async createMemo(
        @CurrentUser() admin: AuthenticatedUser,
        @Body() dto: CreateAdminMemoDto,
    ): Promise<AdminMemoResponseDto> {
        const memo = await this.createAdminMemoService.execute({
            adminId: admin.id,
            content: dto.content,
            target: {
                type: dto.targetType,
                id: BigInt(dto.targetId),
            },
        });

        return {
            id: memo.id.toString(),
            adminId: memo.adminId.toString(),
            adminNickname: memo.adminNickname,
            content: memo.content,
            createdAt: memo.createdAt,
            targetType: memo.target.type,
            targetId: memo.target.id.toString(),
        };
    }

    @Get()
    @ApiOperation({
        summary: 'Find admin memos / 관리자 메모 조회',
        description: 'Find memos associated with a specific domain target. / 특정 도메인 대상에 연결된 메모 목록을 조회합니다.',
    })
    @ApiStandardResponse(AdminMemoResponseDto, {
        status: 200,
        description: 'Memos retrieved successfully / 메모 목록 조회 성공',
        isArray: true,
    })
    async getMemos(
        @Query() query: FindAdminMemosQueryDto,
    ): Promise<AdminMemoResponseDto[]> {
        const memos = await this.findAdminMemoService.findByTarget(
            query.targetType,
            BigInt(query.targetId),
            query.limit,
        );

        return memos.map(memo => ({
            id: memo.id.toString(),
            adminId: memo.adminId.toString(),
            adminNickname: memo.adminNickname,
            content: memo.content,
            createdAt: memo.createdAt,
            targetType: memo.target.type,
            targetId: memo.target.id.toString(),
        }));
    }
}
