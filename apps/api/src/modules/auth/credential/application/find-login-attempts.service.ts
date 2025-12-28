import { Inject, Injectable } from '@nestjs/common';
import {
  LOGIN_ATTEMPT_REPOSITORY,
  type LoginAttemptRepositoryPort,
} from '../ports/out';
import { LoginAttempt } from '../domain';

export interface FindLoginAttemptsParams {
  email?: string;
  ipAddress?: string;
  limit?: number;
}

/**
 * 로그인 시도 기록 조회 Use Case
 */
@Injectable()
export class FindLoginAttemptsService {
  constructor(
    @Inject(LOGIN_ATTEMPT_REPOSITORY)
    private readonly repository: LoginAttemptRepositoryPort,
  ) {}

  async execute({
    email,
    ipAddress,
    limit = 50,
  }: FindLoginAttemptsParams): Promise<LoginAttempt[]> {
    return await this.repository.listRecent({
      email,
      ipAddress,
      limit,
    });
  }
}
