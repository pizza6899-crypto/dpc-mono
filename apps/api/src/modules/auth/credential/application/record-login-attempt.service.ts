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
import { IdUtil } from 'src/utils/id.util';

export interface RecordLoginAttemptParams {
  userId?: string | null;
  result: LoginAttemptResult;
  failureReason?: LoginFailureReason | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceFingerprint?: string | null;
  isMobile?: boolean | null;
  email?: string | null;
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
    email,
    isAdmin,
  }: RecordLoginAttemptParams): Promise<LoginAttempt> {
    const uid = IdUtil.generateUid(); // CUID2 생성

    let attempt: LoginAttempt;

    if (result === LoginAttemptResult.SUCCESS && userId) {
      attempt = LoginAttempt.createSuccess({
        uid,
        userId,
        ipAddress,
        userAgent,
        deviceFingerprint,
        isMobile,
        email,
        isAdmin,
      });
    } else {
      attempt = LoginAttempt.createFailure({
        uid,
        failureReason: failureReason || LoginFailureReason.UNKNOWN,
        userId,
        ipAddress,
        userAgent,
        deviceFingerprint,
        isMobile,
        email,
        isAdmin,
      });
    }

    return await this.repository.create(attempt);
  }
}
