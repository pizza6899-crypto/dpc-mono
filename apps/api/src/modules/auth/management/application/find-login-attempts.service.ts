import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import {
  LOGIN_ATTEMPT_REPOSITORY,
  type LoginAttemptRepositoryPort,
} from '../../credential/ports/out';
import { LoginAttempt } from '../../credential/domain';

export interface FindLoginAttemptsParams {
  loginId?: string;
  ipAddress?: string;
  limit?: number;
}

/**
 * 로그인 시도 기록 조회 Use Case
 */
@Injectable()
export class FindLoginAttemptsService {
  private readonly DEFAULT_LIMIT = 50;
  private readonly MAX_LIMIT = 100;
  private readonly MIN_LIMIT = 1;

  constructor(
    @Inject(LOGIN_ATTEMPT_REPOSITORY)
    private readonly repository: LoginAttemptRepositoryPort,
  ) { }

  async execute({
    loginId,
    ipAddress,
    limit,
  }: FindLoginAttemptsParams): Promise<LoginAttempt[]> {
    // 빈 문자열을 undefined로 정규화
    const normalizedLoginId = loginId?.trim() || undefined;
    const normalizedIpAddress = ipAddress?.trim() || undefined;

    // 필터 조건 검증: loginId 또는 ipAddress 중 하나는 필수 (빈 문자열 제외)
    if (!normalizedLoginId && !normalizedIpAddress) {
      throw new BadRequestException(
        'At least one filter condition (loginId or ipAddress) is required',
      );
    }

    // limit 검증 및 기본값 설정
    const validatedLimit = this.validateLimit(limit);

    return await this.repository.listRecent({
      loginId: normalizedLoginId,
      ipAddress: normalizedIpAddress,
      limit: validatedLimit,
    });
  }

  /**
   * limit 값 검증 및 정규화
   */
  private validateLimit(limit?: number): number {
    if (limit === undefined || limit === null) {
      return this.DEFAULT_LIMIT;
    }

    if (!Number.isInteger(limit) || limit < this.MIN_LIMIT) {
      throw new BadRequestException(
        `Limit must be an integer greater than or equal to ${this.MIN_LIMIT}`,
      );
    }

    if (limit > this.MAX_LIMIT) {
      throw new BadRequestException(`Limit cannot exceed ${this.MAX_LIMIT}`);
    }

    return limit;
  }
}
