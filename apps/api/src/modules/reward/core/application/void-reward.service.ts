import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { LockNamespace } from 'src/common/concurrency/concurrency.constants';
import { type IRewardRepository, REWARD_REPOSITORY } from '../ports/reward.repository.port';
import { UserReward } from '../domain/reward.entity';
import { RewardNotFoundException } from '../domain/reward.exception';

export interface VoidRewardCommand {
    rewardId: bigint;
    reason?: string;
}

@Injectable()
export class VoidRewardService {
    constructor(
        @Inject(REWARD_REPOSITORY)
        private readonly rewardRepository: IRewardRepository,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * 어드민 또는 시스템이 보상을 무효화(Void) 처리합니다.
     * 유저의 Claim 시도와의 레이스 컨디션을 막기 위해 DB Advisory Lock을 적용합니다.
     */
    async execute(command: VoidRewardCommand): Promise<UserReward> {
        return this.prisma.$transaction(async (tx) => {
            // 1. 상태 변경 시 유저의 수령 요청과 충돌을 막기 위해 락 체결
            const key = this.generateAdvisoryKey(LockNamespace.USER_REWARD, command.rewardId.toString());
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(${key})`;

            // 2. 단건 조회 (Transaction Context)
            const rewardModel = await tx.userReward.findUnique({
                where: { id: command.rewardId },
            });
            const reward = rewardModel ? await this.rewardRepository.findById(command.rewardId) : null;

            if (!reward) {
                throw new RewardNotFoundException();
            }

            // 3. 도메인 엔티티 내부에서 상태 전이 (VOIDED)
            // 이미 CLAIMED 상태라면 RewardAlreadyClaimedCannotVoidException을 던짐
            reward.markAsVoided(command.reason);

            // 4. 변경된 상태를 영속화
            await tx.userReward.update({
                where: { id: reward.id },
                data: {
                    status: reward.status,       // VOIDED
                    reason: reward.reason,       // 취소 사유
                    updatedAt: new Date(),
                }
            });

            return reward;
        });
    }

    /**
     * [Helper] 네임스페이스와 ID를 조합해 트랜잭션 수명 주기를 갖는 락 키 생성
     */
    private generateAdvisoryKey(namespace: LockNamespace, id: string | number): bigint {
        const crypto = require('crypto');
        const input = `${namespace}:${id}`;
        const hash = crypto.createHash('md5').update(input).digest('hex');
        const high = BigInt('0x' + hash.substring(0, 16));
        return BigInt.asIntN(64, high);
    }
}
