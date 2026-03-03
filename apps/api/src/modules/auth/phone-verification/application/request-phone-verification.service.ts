import { Injectable, Inject } from '@nestjs/common';
import { TokenType, ChannelType } from '@prisma/client';
import { GetUserService } from 'src/modules/user/profile/application/get-user.service';
import { PHONE_VERIFICATION_REPOSITORY } from '../ports/out/phone-verification.repository.token';
import type { PhoneVerificationRepositoryPort } from '../ports/out/phone-verification.repository.port';
import { SendAlertService } from 'src/modules/notification/alert/application/send-alert.service';
import { NOTIFICATION_EVENTS } from 'src/modules/notification/common';
import { TooManyVerificationRequestsException } from '../domain/phone-verification.exception';

@Injectable()
export class RequestPhoneVerificationService {
    constructor(
        private readonly getUserService: GetUserService,
        @Inject(PHONE_VERIFICATION_REPOSITORY)
        private readonly phoneVerificationRepository: PhoneVerificationRepositoryPort,
        private readonly sendAlertService: SendAlertService,
    ) { }

    async execute(userId: bigint, phoneNumber: string): Promise<void> {
        // 1. 중복 번호 체크 (본인 제외 타인 사용 여부)
        await this.getUserService.ensurePhoneNumberAvailable(phoneNumber, userId);

        // 2. 도배 방지 (최근 발송 내역 확인 - 1분 내 재요청 금지)
        const latestToken = await this.phoneVerificationRepository.findLatest(
            userId,
            TokenType.PHONE_VERIFICATION,
        );

        if (latestToken && latestToken.createdAt) {
            const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
            if (latestToken.createdAt > oneMinuteAgo) {
                throw new TooManyVerificationRequestsException();
            }
        }

        // 3. 6자리 인증번호 생산 및 DB 저장용 고유 토큰(UUID) 발급
        // DB 테이블의 token 필드가 @unique 이므로 6자리 랜덤 숫자는 충돌 위험이 큽니다.
        const { randomUUID, randomInt } = require('crypto');
        const verificationCode = randomInt(100000, 1000000).toString();
        const secureTokenId = randomUUID();

        // 4. 토큰 저장 (유효기간 5분)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await this.phoneVerificationRepository.save({
            userId,
            type: TokenType.PHONE_VERIFICATION,
            token: secureTokenId, // 충돌 방지를 위해 UUID 저장
            expiresAt,
            metadata: {
                phoneNumber,
                code: verificationCode // 실제 6자리 인증 코드는 메타데이터에 보관 
            },
        });

        // 5. 알림 발송 요청 (비동기)
        // 유저 언어와 기본 연락처 정보는 알림 워커가 자동으로 처리합니다.
        // 하지만 휴대폰인증은 "입력받은 번호"로 보내야 하므로 target을 명시합니다.
        await this.sendAlertService.execute({
            event: NOTIFICATION_EVENTS.PHONE_VERIFICATION_CODE,
            userId,
            payload: { code: verificationCode, target: phoneNumber },
            channels: [ChannelType.SMS],
        });
    }
}
