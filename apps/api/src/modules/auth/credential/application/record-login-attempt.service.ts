import { Inject, Injectable } from '@nestjs/common';
import {
  LOGIN_ATTEMPT_REPOSITORY,
  type LoginAttemptRepositoryPort,
} from '../ports/out';
import {
  LoginAttempt,
  LoginAttemptResult,
  LoginFailureReason,
} from '../domain';

export interface RecordLoginAttemptParams {
  userId?: bigint | null;
  result: LoginAttemptResult;
  failureReason?: LoginFailureReason | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceFingerprint?: string | null;
  isMobile?: boolean | null;
  loginId?: string | null;
  isAdmin?: boolean;
}

@Injectable()
export class RecordLoginAttemptService {
  constructor(
    @Inject(LOGIN_ATTEMPT_REPOSITORY)
    private readonly repository: LoginAttemptRepositoryPort,
  ) {}

  async execute({
    userId,
    result,
    failureReason,
    ipAddress,
    userAgent,
    deviceFingerprint,
    isMobile,
    loginId,
    isAdmin,
  }: RecordLoginAttemptParams): Promise<LoginAttempt> {
    let attempt: LoginAttempt;

    // 성공한 로그인 시도는 userId가 필수입니다.
    // result가 SUCCESS인데 userId가 없으면 실패로 처리합니다.
    if (result === LoginAttemptResult.SUCCESS && userId) {
      attempt = LoginAttempt.createSuccess({
        userId,
        ipAddress,
        userAgent,
        deviceFingerprint,
        isMobile,
        loginId,
        isAdmin,
      });
    } else {
      // 실패한 로그인 시도 또는 SUCCESS인데 userId가 없는 경우
      attempt = LoginAttempt.createFailure({
        failureReason: failureReason || LoginFailureReason.UNKNOWN,
        userId, // 실패한 경우에도 userId를 알 수 있으면 기록 (보안 정책 적용에 유리)
        ipAddress,
        userAgent,
        deviceFingerprint,
        isMobile,
        loginId,
        isAdmin,
      });
    }

    return await this.repository.create(attempt);
  }
}
