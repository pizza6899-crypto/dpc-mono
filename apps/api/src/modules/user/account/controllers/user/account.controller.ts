import {
    Controller,
    Post,
    Body,
    HttpStatus,
    HttpCode,
    UseGuards,
    Get,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
    ApiStandardResponse,
    ApiStandardErrors,
} from 'src/common/http/decorators/api-response.decorator';
import { Public } from 'src/common/auth/decorators/roles.decorator';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { RegisterUserService } from '../../application/register-user.service';
import { RegisterSocialUserService } from '../../application/register-social-user.service';
import { RegistrationLimitGuard } from '../../guards/registration-limit.guard';
import { CheckAvailabilityService } from '../../application/check-availability.service';
import { AvailabilityRequestDto } from './dto/request/availability.request.dto';
import { AvailabilityResponseDto } from './dto/response/availability.response.dto';
import { RegisterRequestDto } from './dto/request/register.request.dto';
import { RegisterSocialRequestDto } from './dto/request/register-social.request.dto';
import { RegisterResponseDto } from './dto/response/register.response.dto';
import { RegistrationMethod } from '@prisma/client';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { Throttle } from 'src/common/throttle/decorators/throttle.decorator';
import { GetUserConfigService } from 'src/modules/user/config/application/get-user-config.service';
import { UserPolicyResponseDto } from './dto/response/user-policy.response.dto';
import { LogType } from 'src/modules/audit-log/domain';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';

@ApiTags('User Account')
@Controller('users')
@ApiStandardErrors()
export class UserAccountController {
    constructor(
        private readonly registerUserService: RegisterUserService,
        private readonly registerSocialUserService: RegisterSocialUserService,
        private readonly checkAvailabilityService: CheckAvailabilityService,
        private readonly getUserConfigService: GetUserConfigService,
        private readonly sqidsService: SqidsService,
    ) { }

    @Public()
    @Get('policy')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get Registration Policy / 가입 정책 정보 조회',
        description: 'Get current registration policy for dynamic form configuration (required fields, validation regex, etc.). / 회원가입 폼 구성을 위해 현재 설정된 가입 정책(필수 필드, 유효성 검사 정규식 등) 정보를 조회합니다.',
    })
    @ApiStandardResponse(UserPolicyResponseDto)
    async getUserPolicy(): Promise<UserPolicyResponseDto> {
        const config = await this.getUserConfigService.execute();

        return {
            allowSignup: config.allowSignup,
            loginIdType: config.loginIdType,
            requireNickname: config.requireNickname,
            requireReferralCode: config.requireReferralCode,
            loginIdEmailRegex: config.loginIdEmailRegex,
            loginIdPhoneNumberRegex: config.loginIdPhoneNumberRegex,
            loginIdUsernameRegex: config.loginIdUsernameRegex,
            nicknameRegex: config.nicknameRegex,
            passwordRegex: config.passwordRegex,
        };
    }

    @Public()
    @Get('availability')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Check Availability / 중복 확인',
        description: 'Check if the login ID or nickname is already in use. / 아이디 또는 닉네임의 중복 여부를 확인합니다.',
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'CHECK_AVAILABILITY',
        category: 'AUTH',
        extractMetadata: (req) => ({
            field: req.query.field,
            value: req.query.value,
        }),
    })
    @ApiStandardResponse(AvailabilityResponseDto)
    @Throttle({ limit: 30, ttl: 60 })
    async checkAvailability(
        @Query() query: AvailabilityRequestDto,
    ): Promise<AvailabilityResponseDto> {
        return this.checkAvailabilityService.execute(query);
    }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @Public()
    @UseGuards(RegistrationLimitGuard)
    @ApiOperation({
        summary: 'Register User / 회원가입',
        description: 'Create an account using ID and password. The required fields and validation rules follow the settings from "GET /users/policy". / 아이디와 비밀번호를 사용하여 계정을 생성합니다. 필수 입력 항목 및 검증 규칙은 "/users/policy" API의 설정을 따릅니다.',
    })
    @AuditLog({
        type: LogType.AUTH,
        action: 'REGISTER',
        extractMetadata: (_req, [requestInfo, dto]) => ({
            method: RegistrationMethod.CREDENTIAL,
            loginId: dto.loginId,
            nickname: dto.nickname,
            referralCode: dto.referralCode,
        }),
    })
    @ApiStandardResponse(RegisterResponseDto, { status: HttpStatus.CREATED })
    async register(
        @RequestClientInfoParam() requestInfo: RequestClientInfo,
        @Body() dto: RegisterRequestDto,
    ): Promise<RegisterResponseDto> {
        const result = await this.registerUserService.execute({
            ...dto,
            registrationMethod: RegistrationMethod.CREDENTIAL,
            requestInfo,
        });

        return {
            id: this.sqidsService.encode(result.id, SqidsPrefix.USER),
            loginId: result.loginId,
            nickname: result.nickname,
            email: result.email,
            referralCode: result.referralCode,
        };
    }

    @Post('register/social')
    @HttpCode(HttpStatus.CREATED)
    @Public()
    @UseGuards(RegistrationLimitGuard)
    @ApiOperation({
        summary: 'Register User (SOCIAL) / 소셜 연동 가입',
        description: 'Create an account by linking a social account (Google, Apple, etc.). Validation rules follow the settings from "GET /users/policy". / 소셜 계정(Google, Apple 등)을 연동하여 계정을 생성합니다. 검증 규칙은 "/users/policy" API의 설정을 따릅니다.',
    })
    @AuditLog({
        type: LogType.AUTH,
        action: 'REGISTER_SOCIAL',
        extractMetadata: (_req, [requestInfo, dto]) => ({
            method: RegistrationMethod.SOCIAL,
            provider: dto.provider,
            email: dto.email,
            referralCode: dto.referralCode,
        }),
    })
    @ApiStandardResponse(RegisterResponseDto, { status: HttpStatus.CREATED })
    async registerSocial(
        @RequestClientInfoParam() requestInfo: RequestClientInfo,
        @Body() dto: RegisterSocialRequestDto,
    ): Promise<RegisterResponseDto> {
        const result = await this.registerSocialUserService.execute({
            provider: dto.provider,
            oauthId: dto.oauthId,
            email: dto.email,
            referralCode: dto.referralCode,
            requestInfo,
        });

        return {
            id: this.sqidsService.encode(result.id, SqidsPrefix.USER),
            loginId: result.loginId,
            nickname: result.nickname,
            email: result.email,
        };
    }
}
