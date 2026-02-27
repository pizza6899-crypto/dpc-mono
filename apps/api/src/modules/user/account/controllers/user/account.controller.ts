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
import { CheckAvailabilityRequestDto } from './dto/request/check-availability.request.dto';
import { CheckAvailabilityResponseDto } from './dto/response/check-availability.response.dto';
import { RegisterFiatRequestDto } from './dto/request/register-fiat.request.dto';
import { RegisterCryptoRequestDto } from './dto/request/register-crypto.request.dto';
import { RegisterSocialRequestDto } from './dto/request/register-social.request.dto';
import { RegisterResponseDto } from './dto/response/register.response.dto';
import { RegistrationMethod } from '@prisma/client';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { Throttle } from 'src/common/throttle/decorators/throttle.decorator';

@ApiTags('User Account')
@Controller('users')
@ApiStandardErrors()
export class UserAccountController {
    constructor(
        private readonly registerUserService: RegisterUserService,
        private readonly registerSocialUserService: RegisterSocialUserService,
        private readonly checkAvailabilityService: CheckAvailabilityService,
        private readonly sqidsService: SqidsService,
    ) { }

    @Public()
    @Get('check-availability')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Check Login ID / Nickname Availability / 중복 확인',
        description: 'Check if the login ID or nickname is already in use. / 아이디 또는 닉네임의 중복 여부를 확인합니다.',
    })
    @ApiStandardResponse(CheckAvailabilityResponseDto)
    @Throttle({ limit: 30, ttl: 60 })
    async checkAvailability(
        @Query() query: CheckAvailabilityRequestDto,
    ): Promise<CheckAvailabilityResponseDto> {
        return this.checkAvailabilityService.execute(query);
    }

    @Post('register/fiat')
    @HttpCode(HttpStatus.CREATED)
    @Public()
    @UseGuards(RegistrationLimitGuard)
    @ApiOperation({
        summary: 'Register User (FIAT) / 기명 회원가입',
        description: 'ID, 비밀번호를 사용하여 계좌 기반의 정식 계정을 생성합니다.',
    })
    @ApiStandardResponse(RegisterResponseDto, { status: HttpStatus.CREATED })
    async registerFiat(
        @RequestClientInfoParam() requestInfo: RequestClientInfo,
        @Body() dto: RegisterFiatRequestDto,
    ): Promise<RegisterResponseDto> {
        const result = await this.registerUserService.execute({
            ...dto,
            registrationMethod: RegistrationMethod.FIAT,
            requestInfo,
        });

        return {
            id: this.sqidsService.encode(result.id, SqidsPrefix.USER),
            email: result.email,
        };
    }

    @Post('register/crypto')
    @HttpCode(HttpStatus.CREATED)
    @Public()
    @UseGuards(RegistrationLimitGuard)
    @ApiOperation({
        summary: 'Register User (CRYPTO) / 무기명 회원가입',
        description: 'ID, 비밀번호, 텔레그램 아이디 정보를 사용하여 간편 계정을 생성합니다.',
    })
    @ApiStandardResponse(RegisterResponseDto, { status: HttpStatus.CREATED })
    async registerCrypto(
        @RequestClientInfoParam() requestInfo: RequestClientInfo,
        @Body() dto: RegisterCryptoRequestDto,
    ): Promise<RegisterResponseDto> {
        const result = await this.registerUserService.execute({
            ...dto,
            registrationMethod: RegistrationMethod.CRYPTO,
            requestInfo,
        });

        return {
            id: this.sqidsService.encode(result.id, SqidsPrefix.USER),
            email: result.email,
        };
    }

    @Post('register/social')
    @HttpCode(HttpStatus.CREATED)
    @Public()
    @UseGuards(RegistrationLimitGuard)
    @ApiOperation({
        summary: 'Register User (SOCIAL) / 소셜 연동 가입',
        description: 'Google, Apple 등 소셜 계정을 연동하여 계정을 생성합니다.',
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
            email: result.email,
        };
    }
}
