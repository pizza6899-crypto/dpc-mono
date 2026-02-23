// src/modules/reward/core/application/claim-reward.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { AdvisoryLockService } from 'src/common/concurrency/advisory-lock.service';
import { LockNamespace } from 'src/common/concurrency/concurrency.constants';
import { type IRewardRepository, REWARD_REPOSITORY } from '../ports/reward.repository.port';
import { RewardNotFoundException } from '../domain/reward.exception';
import { Transactional } from '@nestjs-cls/transactional';
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
        private readonly advisoryLockService: AdvisoryLockService,

        // 타 모듈 연동 포트들 대기열 (TODO)
        // private readonly walletOperationPort: IWalletOperationPort,
        // private readonly createWageringPort: ICreateWageringRequirementPort,
    ) { }

    /**
     * 유저가 대기(PENDING) 중인 보상을 받기(Claim) 합니다.
     * 동시성 제어를 위해 트랜잭션 내부에서 DB Advisory Lock을 사용합니다.
     */
    @Transactional()
    async execute(command: ClaimRewardCommand): Promise<void> {
        // 1. 유저의 광클 어뷰징 방지를 위해 데이터베이스 기반 Advisory Lock 체결
        await this.advisoryLockService.acquireLock(
            LockNamespace.USER_REWARD,
            command.rewardId.toString()
        );

        // 2. 보상 단건 조회 및 존재 판독
        const reward = await this.rewardRepository.findById(command.rewardId);

        if (!reward || reward.userId !== command.userId) {
            throw new RewardNotFoundException();
        }

        // 3. 도메인 엔티티 내부에서 수령 가능(CLAIMABLE) 상태 체크 및 상태 전이 (CLAIMED)
        reward.markAsClaimed();

        // 4. 거대한 DB ACID 트랜잭션 실행 (Wallet 증가 + Wagering 생성 + Reward 상태 업데이트)
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
        await this.rewardRepository.save(reward);
    }
}
