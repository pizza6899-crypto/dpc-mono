import {
  Controller,
  Post,
  Patch,
  Body,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from '../../../../../common/http/decorators/api-response.decorator';
import { Public } from 'src/common/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { Throttle } from 'src/common/throttle/decorators/throttle.decorator';
import { ThrottleScope } from 'src/common/throttle/types/throttle.types';
import { ChangePasswordService } from '../../application/change-password.service';
import { RequestPasswordResetService } from '../../application/request-password-reset.service';
import { ResetPasswordService } from '../../application/reset-password.service';
import { ChangePasswordRequestDto } from './dto/request/change-password.request.dto';
import { ChangePasswordResponseDto } from './dto/response/change-password.response.dto';
import { RequestPasswordResetRequestDto } from './dto/request/request-password-reset.request.dto';
import { RequestPasswordResetResponseDto } from './dto/response/request-password-reset.response.dto';
import { ResetPasswordRequestDto } from './dto/request/reset-password.request.dto';
import { ResetPasswordResponseDto } from './dto/response/reset-password.response.dto';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';

@Controller('auth/password')
@ApiTags('User Password Management')
@ApiStandardErrors()
export class UserPasswordController {
  constructor(
    private readonly changePasswordService: ChangePasswordService,
    private readonly requestPasswordResetService: RequestPasswordResetService,
    private readonly resetPasswordService: ResetPasswordService,
  ) {}

  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change Password / 비밀번호 변경',
    description:
      '로그인한 사용자가 현재 비밀번호를 알고 있는 상태에서 비밀번호를 변경합니다.',
  })
  @ApiStandardResponse(ChangePasswordResponseDto, {
    status: HttpStatus.OK,
    description: 'Password changed successfully / 비밀번호 변경 성공',
  })
  @AuditLog({
    type: LogType.AUTH,
    action: 'PASSWORD_CHANGE',
    extractMetadata: (_, args, result, error) => {
      if (error) {
        return {
          failureReason: 'INVALID_CURRENT_PASSWORD',
        };
      }
      return {};
    },
  })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordRequestDto,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<ChangePasswordResponseDto> {
    await this.changePasswordService.execute({
      userId: user.id,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
      requestInfo,
      isAdmin: false,
    });

    return {};
  }

  @Post('reset-request')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({
    limit: 5,
    ttl: 3600, // 1시간
    scope: ThrottleScope.IP,
  })
  @ApiOperation({
    summary: 'Request Password Reset / 비밀번호 재설정 요청',
    description: '비밀번호를 잊은 경우 이메일로 재설정 토큰을 발송합니다.',
  })
  @ApiStandardResponse(RequestPasswordResetResponseDto, {
    status: HttpStatus.OK,
    description: 'Password reset email sent / 비밀번호 재설정 이메일 발송 완료',
  })
  @AuditLog({
    type: LogType.AUTH,
    action: 'PASSWORD_RESET_REQUEST',
    extractMetadata: (_, args) => {
      const [dto] = args;
      return {
        loginId: dto.loginId,
      };
    },
  })
  async requestPasswordReset(
    @Body() dto: RequestPasswordResetRequestDto,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<RequestPasswordResetResponseDto> {
    await this.requestPasswordResetService.execute({
      loginId: dto.loginId,
      requestInfo,
    });

    return {
      message: 'Password reset email has been sent.',
    };
  }

  @Post('reset')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({
    limit: 10,
    ttl: 3600, // 1시간
    scope: ThrottleScope.IP,
  })
  @ApiOperation({
    summary: 'Reset Password / 비밀번호 재설정',
    description: '이메일로 받은 토큰을 사용하여 비밀번호를 재설정합니다.',
  })
  @ApiStandardResponse(ResetPasswordResponseDto, {
    status: HttpStatus.OK,
    description: 'Password reset successfully / 비밀번호 재설정 성공',
  })
  @AuditLog({
    type: LogType.AUTH,
    action: 'PASSWORD_RESET',
    extractMetadata: (_, args, result, error) => {
      if (error) {
        let failureReason = 'UNKNOWN_ERROR';
        if (error.message?.includes('INVALID_TOKEN')) {
          failureReason = 'INVALID_TOKEN';
        } else if (error.message?.includes('USER_NOT_FOUND')) {
          failureReason = 'USER_NOT_FOUND';
        }
        return {
          failureReason,
        };
      }
      return {};
    },
  })
  async resetPassword(
    @Body() dto: ResetPasswordRequestDto,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<ResetPasswordResponseDto> {
    await this.resetPasswordService.execute({
      token: dto.token,
      newPassword: dto.newPassword,
      requestInfo,
    });

    return {};
  }
}
