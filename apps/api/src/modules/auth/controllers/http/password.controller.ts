import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
  Query,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from '../../../../platform/http/decorators/api-response.decorator';
import { Public } from 'src/platform/auth/decorators/roles.decorator';
import { AuthAll } from 'src/platform/auth/decorators/roles.decorator';
import { RequestClientInfoParam } from 'src/platform/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { CurrentUser } from 'src/platform/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/platform/auth/decorators/current-user.decorator';
import { PasswordResetRequestDto } from '../../dtos/password-reset-request.dto';
import { PasswordResetDto } from '../../dtos/password-reset.dto';
import { PasswordChangeDto } from '../../dtos/password-change.dto';
import { PasswordResponseDto } from '../../dtos/password-response.dto';
import { Throttle } from 'src/platform/throttle/decorators/throttle.decorator';
import { ThrottleScope } from 'src/platform/throttle/types/throttle.types';
import { PasswordService } from '../../application/password.service';
import {
  PasswordResetVerifyDto,
  PasswordResetVerifyResponseDto,
} from '../../dtos/password-reset-verify.dto';

@Controller('auth/password')
@ApiTags('Password(비밀번호)')
@ApiStandardErrors()
export class PasswordController {
  constructor(private readonly passwordService: PasswordService) {}

  @Post('reset-request')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({
    limit: 5,
    ttl: 3600, // 1시간
    scope: ThrottleScope.IP,
  })
  @ApiOperation({
    summary: 'Request password reset (비밀번호 재설정 요청)',
    description:
      'Request a password reset email. (비밀번호 재설정 이메일을 요청합니다.)',
  })
  @ApiStandardResponse(PasswordResponseDto, {
    status: 200,
    description: 'Password reset email sent successfully',
  })
  async requestPasswordReset(
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
    @Body() passwordResetRequestDto: PasswordResetRequestDto,
  ): Promise<PasswordResponseDto> {
    await this.passwordService.requestPasswordReset(
      passwordResetRequestDto.email,
      requestInfo,
    );
    return {
      message: 'Password reset email sent successfully',
    };
  }

  @Post('reset')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({
    limit: 5,
    ttl: 3600, // 1시간
    scope: ThrottleScope.IP,
  })
  @ApiOperation({
    summary: 'Reset password (비밀번호 재설정)',
    description:
      'Reset password using reset token. (재설정 토큰을 사용하여 비밀번호를 재설정합니다.)',
  })
  @ApiStandardResponse(PasswordResponseDto, {
    status: 200,
    description: 'Password reset successfully',
  })
  async resetPassword(
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
    @Body() passwordResetDto: PasswordResetDto,
  ): Promise<PasswordResponseDto> {
    await this.passwordService.resetPassword(
      passwordResetDto.token,
      passwordResetDto.newPassword,
      requestInfo,
    );
    return {
      message: 'Password reset successfully',
    };
  }

  @Post('change')
  @AuthAll()
  @HttpCode(HttpStatus.OK)
  @Throttle({
    limit: 5,
    ttl: 300, // 5분
    scope: ThrottleScope.USER,
  })
  @ApiOperation({
    summary: 'Change password (비밀번호 변경)',
    description:
      'Change password for authenticated user. (인증된 사용자의 비밀번호를 변경합니다.)',
  })
  @ApiStandardResponse(PasswordResponseDto, {
    status: 200,
    description: 'Password changed successfully',
  })
  async changePassword(
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
    @CurrentUser() user: CurrentUserWithSession,
    @Body() passwordChangeDto: PasswordChangeDto,
  ): Promise<PasswordResponseDto> {
    await this.passwordService.changePassword(
      user.id,
      passwordChangeDto.currentPassword,
      passwordChangeDto.newPassword,
      requestInfo,
    );
    return {
      message: 'Password changed successfully',
    };
  }

  @Get('reset-verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({
    limit: 10,
    ttl: 60, // 1분
    scope: ThrottleScope.IP,
  })
  @ApiOperation({
    summary: 'Verify password reset token (비밀번호 재설정 토큰 검증)',
    description:
      'Verify if the password reset token is valid. (비밀번호 재설정 토큰이 유효한지 검증합니다.)',
  })
  @ApiStandardResponse(PasswordResetVerifyResponseDto, {
    status: 200,
    description: 'Token verification result',
  })
  async verifyResetToken(
    @Query() query: PasswordResetVerifyDto,
  ): Promise<PasswordResetVerifyResponseDto> {
    const result = await this.passwordService.verifyResetToken(query.token);
    return result;
  }
}
