// src/modules/reward/core/application/claim-reward.service.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { AdvisoryLockService } from 'src/common/concurrency/advisory-lock.service';
import { LockNamespace } from 'src/common/concurrency/concurrency.constants';
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

        // 타 모듈 연동 포트들 대기열 (TODO)
        // private readonly walletOperationPort: IWalletOperationPort,
        // private readonly createWageringPort: ICreateWageringRequirementPort,
    ) { }

    /**
     * 유저가 대기(PENDING) 중인 보상을 받기(Claim) 합니다.
     * 동시성 제어를 위해 트랜잭션 내부에서 DB Advisory Lock을 사용합니다.
     */
    async execute(command: ClaimRewardCommand): Promise<void> {
        // 거대한 DB ACID 트랜잭션 실행 (Lock 획득 + Wallet 증가 + Wagering 생성 + Reward 업데이트)
        // Advisory Lock의 Scope이 '트랜잭션 단위'이므로, 트랜잭션 내부에서 select를 진행해야 합니다. 
        await this.prisma.$transaction(async (tx) => {
            // 1. 유저의 광클 어뷰징 방지를 위해 글로벌 분산 락 체결 (Advisory)
            // Kysely/transaction 레벨에서 AdvisoryLockService를 직접 주입받아 써야 하지만, 
            // Prisma Transaction 내부에서는 pg_try_advisory_xact_lock등을 raw 쿼리로 실행 가능
            const key = this.generateAdvisoryKey(LockNamespace.USER_REWARD, command.rewardId.toString());
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(${key})`;

            // 2. 보상 단건 조회 및 존재 판독 (여기서는 Transactional Client tx 사용 권장)
            const rewardModel = await tx.userReward.findUnique({
                where: { id: command.rewardId },
            });
            const reward = rewardModel ? await this.rewardRepository.findById(command.rewardId) : null;

            if (!reward || reward.userId !== command.userId) {
                // 외부 MessageCode를 활용한 예외를 던짐 (보안상 실제 ID 노출 X)
                throw new NotFoundException(MessageCode.REWARD_NOT_FOUND);
            }

            // 3. 도메인 엔티티 내부에서 수령 가능(CLAIMABLE) 상태 체크 및 상태 전이 (CLAIMED)
            reward.markAsClaimed();

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
            await tx.userReward.update({
                where: { id: reward.id },
                data: {
                    status: reward.status,       // CLAIMED
                    claimedAt: reward.claimedAt, // 현재 시각
                    updatedAt: new Date(),
                }
            });
        });

        // 5. 트랜잭션 완료 후 (혹은 외부 시스템 연동) 성공 이벤트(Kafka / EventBus) 퍼블리시 가능
    }

    /**
     * [Helper] 네임스페이스와 ID를 조합하여 PostgreSQL 빅인트 호환 해시 키 생성 
     * AdvisoryLockService와 동일한 로직 복사 (수동 DB 트랜잭션 락 처리용)
     */
    private generateAdvisoryKey(namespace: LockNamespace, id: string | number): bigint {
        const crypto = require('crypto');
        const input = `${namespace}:${id}`;
        const hash = crypto.createHash('md5').update(input).digest('hex');

        // 앞 16자리 (64비트)만 사용 -> BigInt 변환
        const high = BigInt('0x' + hash.substring(0, 16));

        // Signed 64-bit Integer로 변환 (PostgreSQL bigint 호환)
        return BigInt.asIntN(64, high);
    }
}
