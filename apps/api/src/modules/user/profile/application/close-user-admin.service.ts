import { Injectable, Inject, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { USER_REPOSITORY } from '../ports/out/user.repository.token';
import type { UserRepositoryPort } from '../ports/out/user.repository.port';
import {
  UserNotFoundException,
  AccountAlreadyClosedException,
} from '../domain';
import { ExpireUserSessionsService } from 'src/modules/auth/session/application/expire-user-sessions.service';
import { UserStatus } from '@prisma/client';
import { RevokeUserGameSessionsService } from 'src/modules/casino-session/application/revoke-user-game-sessions.service';

export interface CloseUserAdminParams {
  userId: bigint;
  adminId: bigint;
  reason: string;
}

/**
 * 관리자에 의한 사용자 계정 종료(탈퇴) 처리 Use Case
 */
@Injectable()
export class CloseUserAdminService {
  private readonly logger = new Logger(CloseUserAdminService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    private readonly expireUserSessionsService: ExpireUserSessionsService,
    private readonly revokeUserGameSessionsService: RevokeUserGameSessionsService,
  ) { }

  @Transactional()
  async execute({
    userId,
    adminId,
    reason,
  }: CloseUserAdminParams): Promise<void> {
    this.logger.log(
      `Closing account for user ${userId} by admin ${adminId}. Reason: ${reason}`,
    );

    // 1. 사용자 조회
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    // 2. 이미 종료된 계정인지 확인
    if (user.status === UserStatus.CLOSED) {
      throw new AccountAlreadyClosedException();
    }

    // 3. 도메인 로직: 계정 종료 처리
    const closedUser = user.closeAccount(adminId, reason);

    // 4. 변경사항 저장
    await this.userRepository.save(closedUser);

    // 5. 사용자의 모든 활성 세션 즉시 파기
    await this.expireUserSessionsService.execute({
      userId: user.id,
      revokedBy: adminId,
    });

    // 6. 모든 게임 세션 파기
    await this.revokeUserGameSessionsService.execute(user.id, adminId);

    this.logger.log(
      `Successfully closed account and expired sessions for user ${userId}`,
    );
  }
}
