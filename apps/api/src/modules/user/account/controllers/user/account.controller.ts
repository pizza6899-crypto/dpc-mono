import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
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

@Controller('users')
@ApiTags('Users')
@ApiStandardErrors()
export class UserAccountController {
    constructor(
        private readonly registerUserService: RegisterUserService,
        private readonly sqidsService: SqidsService,
    ) { }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @Public()
    @Throttle({
        limit: 10,
        ttl: 60,
        scope: ThrottleScope.IP,
    })
    @ApiOperation({
        summary: 'Register (회원가입)',
        description: '이메일과 비밀번호로 새로운 사용자 계정을 생성합니다.',
    })
    @ApiStandardResponse(RegisterResponseDto, {
        status: HttpStatus.CREATED,
        description: 'Register success',
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
