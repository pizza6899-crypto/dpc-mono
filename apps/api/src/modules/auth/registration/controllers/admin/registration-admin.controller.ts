import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from '../../../../../common/http/decorators/api-response.decorator';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@repo/database';
import { RegisterCredentialAdminService } from '../../application/register-credential-admin.service';
import { RegisterAdminRequestDto } from './dto/request/register-admin.request.dto';
import { RegisterAdminResponseDto } from './dto/response/register-admin.response.dto';

@Controller('admin/registration')
@ApiTags('Admin Registration (관리자 회원가입 관리)')
@ApiStandardErrors()
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class RegistrationAdminController {
  constructor(
    private readonly registerCredentialAdminService: RegisterCredentialAdminService,
  ) {}

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create user (사용자 생성)',
    description:
      'Creates a new user account with email and password. Admin can specify role, country, and timezone. (이메일과 비밀번호로 새로운 사용자 계정을 생성합니다. 관리자는 역할, 국가, 타임존을 지정할 수 있습니다.)',
  })
  @ApiStandardResponse(RegisterAdminResponseDto, {
    status: HttpStatus.CREATED,
    description: 'User created successfully',
  })
  async createUser(
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
    @Body() registerDto: RegisterAdminRequestDto,
  ): Promise<RegisterAdminResponseDto> {
    const result = await this.registerCredentialAdminService.execute({
      email: registerDto.email,
      password: registerDto.password,
      role: registerDto.role,
      country: registerDto.country,
      timezone: registerDto.timezone,
      referralCode: registerDto.referralCode,
      requestInfo,
    });

    return result;
  }
}

