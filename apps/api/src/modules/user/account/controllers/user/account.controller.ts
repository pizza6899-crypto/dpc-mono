import { Controller, Post, Body, HttpStatus, HttpCode, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
    ApiStandardResponse,
    ApiStandardErrors,
} from 'src/common/http/decorators/api-response.decorator';
import { Public } from 'src/common/auth/decorators/roles.decorator';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { Throttle } from 'src/common/throttle/decorators/throttle.decorator';
import { ThrottleScope } from 'src/common/throttle/types/throttle.types';
import { RegisterUserService } from '../../application/register-user.service';
import { RegisterRequestDto } from '../../dto/request/register.request.dto';
import { RegisterResponseDto } from '../../dto/response/register.response.dto';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { GetUserConfigService } from '../../../config/application/get-user-config.service';
import { RegistrationConfigResponseDto } from '../../dto/response/registration-config.response.dto';

@Controller('users')
@ApiTags('Users')
@ApiStandardErrors()
export class UserAccountController {
    constructor(
        private readonly registerUserService: RegisterUserService,
        private readonly sqidsService: SqidsService,
        private readonly getUserConfigService: GetUserConfigService,
    ) { }

    @Get('registration-config')
    @Public()
    @ApiOperation({
        summary: 'Get Registration Config / 회원가입 설정 조회',
        description: 'Returns the registration policy, required fields, and validation rules (regex) for the signup form. / 회원가입 폼 구성을 위한 정책, 필수 필드 여부 및 유효성 검사 규칙(정규식)을 조회합니다.',
    })
    @ApiStandardResponse(RegistrationConfigResponseDto)
    async getRegistrationConfig(): Promise<RegistrationConfigResponseDto> {
        const config = await this.getUserConfigService.execute();

        return {
            allowSignup: config.allowSignup,
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
        };
    }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @Public()
    @Throttle({
        limit: 10,
        ttl: 60,
        scope: ThrottleScope.IP,
    })
    @ApiOperation({
        summary: 'Register User / 사용자 회원가입',
        description: 'Creates a new user account with email, password, and optional referral code. This process initializes the user profile, default wallet, and loyalty tier. / 이메일과 비밀번호, 선택적인 추천 코드를 사용하여 새로운 사용자 계정을 생성합니다. 이 과정에서 유저 프로필, 기본 지갑 및 멤버십 티어가 함께 초기화됩니다.',
    })
    @ApiStandardResponse(RegisterResponseDto, {
        status: HttpStatus.CREATED,
        description: 'User registered successfully. / 회원가입이 성공적으로 완료되었습니다.',
    })
    async register(
        @RequestClientInfoParam() requestInfo: RequestClientInfo,
        @Body() registerDto: RegisterRequestDto,
    ): Promise<RegisterResponseDto> {
        const result = await this.registerUserService.execute({
            email: registerDto.email,
            password: registerDto.password,
            referralCode: registerDto.referralCode,
            requestInfo,
        });

        return {
            id: this.sqidsService.encode(result.id, SqidsPrefix.USER),
            email: result.email,
        };
    }
}
