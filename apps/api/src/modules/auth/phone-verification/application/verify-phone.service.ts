import { Injectable, Inject } from '@nestjs/common';
import { TokenType } from '@prisma/client';
import { Transactional } from '@nestjs-cls/transactional';
import { UpdateVerifiedPhoneService } from 'src/modules/user/profile/application/update-verified-phone.service';
import { PHONE_VERIFICATION_REPOSITORY } from '../ports/out/phone-verification.repository.token';
import type { PhoneVerificationRepositoryPort } from '../ports/out/phone-verification.repository.port';
import { SynchronizeUserSessionService } from 'src/modules/auth/session/application/synchronize-user-session.service';
import {
  VerificationCodeExpiredException,
  InvalidVerificationCodeException,
} from '../domain/phone-verification.exception';

@Injectable()
export class VerifyPhoneService {
  constructor(
    private readonly updateVerifiedPhoneService: UpdateVerifiedPhoneService,
    @Inject(PHONE_VERIFICATION_REPOSITORY)
    private readonly phoneVerificationRepository: PhoneVerificationRepositoryPort,
    private readonly synchronizeUserSessionService: SynchronizeUserSessionService,
  ) {}

  @Transactional()
  async execute(
    userId: bigint,
    phoneNumber: string,
    code: string,
  ): Promise<void> {
    // 1. 토큰 조회 (본인이 요청한 특정 코드의 미사용 토큰 조회)
    const tokenRecord = await this.phoneVerificationRepository.findByToken(
      code,
      TokenType.PHONE_VERIFICATION,
      userId,
    );

    if (!tokenRecord) {
      throw new InvalidVerificationCodeException();
    }

    // 2. 검증 (번호 일치여부, 만료여부)
    // 토큰이 유니크하지 않으므로, 요청한 번호와 토큰 생성 시점의 번호가 일치하는지 반드시 확인
    if (tokenRecord.metadata?.phoneNumber !== phoneNumber) {
      throw new InvalidVerificationCodeException();
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new VerificationCodeExpiredException();
    }

    // 3. 유저 정보 업데이트 (UseCase 사용)
    const savedUser = await this.updateVerifiedPhoneService.execute(
      userId,
      phoneNumber,
    );

    // 4. 토큰 사용 처리
    await this.phoneVerificationRepository.markAsUsed(
      tokenRecord.token,
      userId,
    );

    // 5. 세션 동기화 (Redis)
    await this.synchronizeUserSessionService
      .execute({
        userId: savedUser.id!,
        updateData: {
          isPhoneVerified: true,
        },
      })
      .catch((err) => {
        console.error(`Failed to sync session for user ${savedUser.id}:`, err);
      });
  }
}
