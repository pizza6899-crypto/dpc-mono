// src/modules/reward/core/application/claim-reward.service.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { type IRewardRepository, REWARD_REPOSITORY } from '../ports/reward.repository.port';
import { MessageCode } from '@repo/shared';
// import { WalletService } from 'src/modules/wallet/core/application/wallet.service';
// import { WageringService } from 'src/modules/wagering/requirement/application/wagering.service';

export interface ClaimRewardCommand {
    userId: bigint;
    rewardId: bigint;
}

@Injectable()
export class ClaimRewardService {
    constructor(
        @Inject(REWARD_REPOSITORY)
        private readonly rewardRepository: IRewardRepository,
        private readonly prisma: PrismaService,
        // private readonly redisLockService: RedisAdvisoryLockService, (실제 DPC 프로젝트 글로벌 락)

        // 타 모듈 연동 포트들 대기열 (TODO)
        // private readonly walletOperationPort: IWalletOperationPort,
        // private readonly createWageringPort: ICreateWageringRequirementPort,
    ) { }

    /**
     * 유저가 대기(PENDING) 중인 보상을 받기(Claim) 합니다.
     */
    async execute(command: ClaimRewardCommand): Promise<void> {
        // 1. 유저의 광클 어뷰징 방지를 위해 글로벌 분산 락 체결 (예시)
        // const lockKey = `reward:claim:${command.rewardId}`;
        // await this.redisLockService.runWithLock(lockKey, async () => { ... });

        // 2. 보상 단건 조회 및 존재 판독
        const reward = await this.rewardRepository.findById(command.rewardId);
        if (!reward || reward.userId !== command.userId) {
            // 외부 MessageCode를 활용한 예외를 던짐 (보안상 실제 ID 노출 X)
            throw new NotFoundException(MessageCode.REWARD_NOT_FOUND);
        }

        // 3. 도메인 엔티티 내부에서 수령 가능(CLAIMABLE) 상태 체크 및 상태 전이 (CLAIMED)
        // 만약 만료됐거나 이미 수령된 거라면 여기서 RewardCannotBeClaimedException 터짐
        reward.markAsClaimed();

        // 4. 거대한 DB ACID 트랜잭션 실행 (Wallet 증가 + Wagering 생성 + Reward 상태 업데이트)
        await this.prisma.$transaction(async (tx) => {
            // A. 지갑(Wallet) 모듈에 '보너스 머니' 충전 요청
            // await this.walletOperationPort.depositReward({
            //     tx,
            //     userId: command.userId,
            //     amount: reward.amount,
            //     currency: reward.currency,
            //     referenceType: 'REWARD_CLAIM',
            //     referenceId: reward.id,
            // });

            // B. (롤링 배수가 0이 아닐 경우) 롤링(Wagering) 모듈에 스펙 생성 요청
            // if (reward.wageringMultiplier && reward.wageringMultiplier.greaterThan(0)) {
            //     await this.createWageringPort.create({
            //         tx,
            //         userId: command.userId,
            //         bonusAmount: reward.amount,
            //         multiplier: reward.wageringMultiplier,
            //         targetType: reward.wageringTargetType,
            //         expiresDays: reward.wageringExpiryDays,
            //         maxCashConversion: reward.maxCashConversion,
            //         // ...
            //     });
            // }

            // C. 이 보상의 상태를 CLAIMED 로 DB에 확정 업데이트
            // (트랜잭션 세션(tx)을 물어줘야 하므로, 실제 구현 시 rewardRepository 쪽에 tx 옵션(port)을 추가하거나 Kysely 로 처리합니다)
            // 임시로 직접 업데이트:
            await tx.userReward.update({
                where: { id: reward.id },
                data: {
                    status: reward.status,       // CLAIMED
                    claimedAt: reward.claimedAt, // 현재 시각
                    updatedAt: new Date(),
                }
            });
        });

        // 5. 트랜잭션 완료 후 성공 이벤트(Kafka / EventBus) 퍼블리시 가능
    }
}
