import { Injectable, Inject, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { USER_REPOSITORY } from '../ports/out/user.repository.token';
import type { UserRepositoryPort } from '../ports/out/user.repository.port';
import { UserNotFoundException, UserNotClosedException } from '../domain';
import { UserStatus } from '@prisma/client';

export interface RestoreUserAdminParams {
    userId: bigint;
    adminId: bigint;
}

/**
 * 관리자에 의한 사용자 계정 복구 처리 Use Case
 */
@Injectable()
export class RestoreUserAdminService {
    private readonly logger = new Logger(RestoreUserAdminService.name);

    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
    ) { }

    @Transactional()
    async execute({ userId, adminId }: RestoreUserAdminParams): Promise<void> {
        this.logger.log(`Restoring account for user ${userId} by admin ${adminId}`);

        // 1. 사용자 조회
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new UserNotFoundException();
        }

        // 2. 종료된 계정인지 확인
        if (user.status !== UserStatus.CLOSED) {
            throw new UserNotClosedException();
        }

        // 3. 도메인 로직: 계정 복구 처리
        const restoredUser = user.restoreAccount();

        // 4. 변경사항 저장
        await this.userRepository.save(restoredUser);

        this.logger.log(`Successfully restored account for user ${userId}`);
    }
}
