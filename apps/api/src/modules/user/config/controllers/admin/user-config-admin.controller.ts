import {
    Controller,
    Get,
    Patch,
    Body,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
    ApiStandardErrors,
    ApiStandardResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';
import { GetUserConfigService } from '../../application/get-user-config.service';
import { UpdateUserConfigAdminService } from '../../application/update-user-config-admin.service';
import { UserConfigResponseDto } from './dto/response/user-config-response.dto';
import { UpdateUserConfigDto } from './dto/request/update-user-config.dto';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';

@Controller('admin/user-config')
@ApiTags('Admin User Config')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class UserConfigAdminController {
    constructor(
        private readonly getUserConfigService: GetUserConfigService,
        private readonly updateUserConfigAdminService: UpdateUserConfigAdminService,
    ) { }

    /**
     * 전역 사용자 설정 조회 (관리자용)
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get Global User Config / 전역 사용자 설정 조회',
        description: 'Retrieves the system-wide user registration policies, required fields, and validation rules. / 시스템 전역 사용자 가입 정책, 필수 필드 여부 및 유효성 검사 규칙을 조회합니다.',
    })
    @ApiStandardResponse(UserConfigResponseDto, {
        status: 200,
        description: 'Successfully retrieved user configuration / 설정 조회 성공',
    })
    async getConfig(): Promise<UserConfigResponseDto> {
        const config = await this.getUserConfigService.execute();

        return {
            id: config.id,
            allowSignup: config.allowSignup,
            defaultStatus: config.defaultStatus,
            maxDailySignupPerIp: config.maxDailySignupPerIp,
            loginIdType: config.loginIdType,
            requireEmail: config.requireEmail,
            requirePhoneNumber: config.requirePhoneNumber,
            requireBirthDate: config.requireBirthDate,
            requireNickname: config.requireNickname,
            requireReferralCode: config.requireReferralCode,
            allowedOAuthProviders: config.allowedOAuthProviders,
            loginIdEmailRegex: config.loginIdEmailRegex,
            loginIdPhoneNumberRegex: config.loginIdPhoneNumberRegex,
            loginIdUsernameRegex: config.loginIdUsernameRegex,
            nicknameRegex: config.nicknameRegex,
            passwordRegex: config.passwordRegex,
            defaultPrimaryCurrency: config.defaultPrimaryCurrency,
            defaultPlayCurrency: config.defaultPlayCurrency,
            defaultLanguage: config.defaultLanguage,
            adminNote: config.adminNote,
            updatedBy: config.updatedBy?.toString() ?? null,
            createdAt: config.createdAt,
            updatedAt: config.updatedAt,
        };
    }

    /**
     * 전역 사용자 설정 수정 (관리자용)
     */
    @Patch()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Update Global User Config / 전역 사용자 설정 수정',
        description: 'Updates the global user registration policies and validation regex. This affects the behavior of the public registration forms. / 시스템 전역 사용자 가입 정책 및 정규식 설정을 변경합니다. 이 설정은 공개 회원가입 폼의 동작에 즉시 영향을 미칩니다.',
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'USER_CONFIG',
        action: 'UPDATE_CONFIG',
        extractMetadata: (req) => ({ body: req.body }),
    })
    @ApiStandardResponse(UserConfigResponseDto, {
        status: 200,
        description: 'Successfully updated user configuration / 설정 수정 성공',
    })
    async updateConfig(
        @CurrentUser() admin: AuthenticatedUser,
        @Body() dto: UpdateUserConfigDto,
    ): Promise<UserConfigResponseDto> {
        const config = await this.updateUserConfigAdminService.execute(admin.id, dto);

        return {
            id: config.id,
            allowSignup: config.allowSignup,
            defaultStatus: config.defaultStatus,
            maxDailySignupPerIp: config.maxDailySignupPerIp,
            loginIdType: config.loginIdType,
            requireEmail: config.requireEmail,
            requirePhoneNumber: config.requirePhoneNumber,
            requireBirthDate: config.requireBirthDate,
            requireNickname: config.requireNickname,
            requireReferralCode: config.requireReferralCode,
            allowedOAuthProviders: config.allowedOAuthProviders,
            loginIdEmailRegex: config.loginIdEmailRegex,
            loginIdPhoneNumberRegex: config.loginIdPhoneNumberRegex,
            loginIdUsernameRegex: config.loginIdUsernameRegex,
            nicknameRegex: config.nicknameRegex,
            passwordRegex: config.passwordRegex,
            defaultPrimaryCurrency: config.defaultPrimaryCurrency,
            defaultPlayCurrency: config.defaultPlayCurrency,
            defaultLanguage: config.defaultLanguage,
            adminNote: config.adminNote,
            updatedBy: config.updatedBy?.toString() ?? null,
            createdAt: config.createdAt,
            updatedAt: config.updatedAt,
        };
    }
}
