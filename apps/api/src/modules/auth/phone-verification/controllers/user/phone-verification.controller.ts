import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import * as AuthTypes from 'src/common/auth/types/auth.types';
import {
  ApiStandardErrors,
  ApiStandardResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { RequestPhoneVerificationRequestDto } from './dto/request/request-phone-verification.request.dto';
import { VerifyPhoneRequestDto } from './dto/request/verify-phone.request.dto';
import { RequestPhoneVerificationService } from '../../application/request-phone-verification.service';
import { VerifyPhoneService } from '../../application/verify-phone.service';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { Throttle } from 'src/common/throttle/decorators/throttle.decorator';
import { ThrottleScope } from 'src/common/throttle/types/throttle.types';

@ApiTags('User Phone Verification')
@Controller('auth/phone')
@ApiStandardErrors()
@ApiCookieAuth()
export class PhoneVerificationController {
  constructor(
    private readonly requestPhoneVerificationService: RequestPhoneVerificationService,
    private readonly verifyPhoneService: VerifyPhoneService,
  ) {}

  @Post('verify-request')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Request phone verification / 휴대폰 인증번호 발송 요청',
    description:
      'Generates and sends a 6-digit verification code to the provided phone number. / 입력된 휴대폰 번호로 6자리 인증번호를 생성하여 발송합니다.',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'USER',
    action: 'REQUEST_PHONE_VERIFICATION',
    extractMetadata: (req) => ({ phoneNumber: req.body.phoneNumber }),
  })
  @ApiStandardResponse(Object, {
    status: HttpStatus.ACCEPTED,
    description: 'Verification code sent successfully',
  })
  @Throttle({ limit: 10, ttl: 3600, scope: ThrottleScope.IP }) // 시간당 10회 제한 (IP 기준)
  async requestVerification(
    @CurrentUser() user: AuthTypes.AuthenticatedUser,
    @Body() dto: RequestPhoneVerificationRequestDto,
  ): Promise<void> {
    return this.requestPhoneVerificationService.execute(
      user.id,
      dto.phoneNumber,
    );
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify phone number / 휴대폰 인증번호 확인 및 등록',
    description:
      'Validates the 6-digit code and registers the phone number to the user profile. / 6자리 인증번호를 검증하고 해당 번호를 유저 프로필에 등록합니다.',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'USER',
    action: 'VERIFY_PHONE_NUMBER',
    extractMetadata: (req) => ({ phoneNumber: req.body.phoneNumber }),
  })
  @ApiStandardResponse(Object, {
    status: HttpStatus.OK,
    description: 'Phone number verified and registered successfully',
  })
  @Throttle({ limit: 10, ttl: 60, scope: ThrottleScope.USER }) // 분당 10회 검증 시도 제한 (무차별 대입 방지)
  async verifyPhone(
    @CurrentUser() user: AuthTypes.AuthenticatedUser,
    @Body() dto: VerifyPhoneRequestDto,
  ): Promise<void> {
    return this.verifyPhoneService.execute(user.id, dto.phoneNumber, dto.code);
  }
}
