import {
  Controller,
  Post,
  Body,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from '../../../../../platform/http/decorators/api-response.decorator';
import { Public } from 'src/platform/auth/decorators/roles.decorator';
import { RequestClienttInfo } from 'src/platform/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { Throttle } from 'src/platform/throttle/decorators/throttle.decorator';
import { ThrottleScope } from 'src/platform/throttle/types/throttle.types';
import { RegisterCredentialService } from '../../application/register-credential.service';
import { RegisterRequestDto } from './dto/request/register.request.dto';
import { RegisterResponseDto } from './dto/response/register.response.dto';

@Controller('auth/register')
@ApiTags('Auth(인증)')
@ApiStandardErrors()
export class RegistrationController {
  constructor(
    private readonly registerCredentialService: RegisterCredentialService,
  ) {}

  @Post()
  @Public()
  @Throttle({
    limit: 5,
    ttl: 1800, // 30분
    scope: ThrottleScope.IP,
  })
  @ApiOperation({
    summary: 'Register (회원가입)',
    description:
      'Creates a new user account with email and password. (이메일과 비밀번호로 새로운 사용자 계정을 생성합니다.)',
  })
  @ApiStandardResponse(RegisterResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Register success',
  })
  async register(
    @RequestClienttInfo() requestInfo: RequestClientInfo,
    @Body() registerDto: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
    const result = await this.registerCredentialService.execute({
      email: registerDto.email,
      password: registerDto.password,
      referralCode: registerDto.referralCode,
      requestInfo,
    });

    return result;
  }
}

