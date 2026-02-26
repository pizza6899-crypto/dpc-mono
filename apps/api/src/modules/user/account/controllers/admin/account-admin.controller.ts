import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
    ApiStandardResponse,
    ApiStandardErrors,
} from 'src/common/http/decorators/api-response.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { RegisterAdminService } from '../../application/register-admin.service';
import { RegisterAdminRequestDto } from '../../dto/request/register-admin.request.dto';
import { RegisterAdminResponseDto } from '../../dto/response/register-admin.response.dto';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';

import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';

@Controller('admin/users')
@ApiTags('Admin Users')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class UserAccountAdminController {
    constructor(
        private readonly registerAdminService: RegisterAdminService,
        private readonly sqidsService: SqidsService,
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Register user by admin (관리자에 의한 사용자 생성)',
        description: '관리자가 명시적으로 새로운 사용자 계정을 생성합니다.',
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'USER',
        action: 'ADMIN_CREATE_USER',
        extractMetadata: (req) => ({ body: req.body }),
    })
    @ApiStandardResponse(RegisterAdminResponseDto, {
        status: HttpStatus.CREATED,
        description: 'Admin Register success',
    })
    async register(
        @CurrentUser() admin: AuthenticatedUser,
        @RequestClientInfoParam() requestInfo: RequestClientInfo,
        @Body() dto: RegisterAdminRequestDto,
    ): Promise<RegisterAdminResponseDto> {
        const result = await this.registerAdminService.execute({
            email: dto.email,
            password: dto.password,
            role: dto.role,
            country: dto.country,
            referralCode: dto.referralCode,
            requestInfo,
        });

        return {
            id: this.sqidsService.encode(result.id, SqidsPrefix.USER),
            email: result.email,
            role: result.role,
            status: result.status,
        };
    }
}
