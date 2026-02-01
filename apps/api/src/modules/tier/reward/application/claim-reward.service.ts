import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { TierRewardRepositoryPort } from '../infrastructure/tier-reward.repository.port';

@Injectable()
export class ClaimRewardService {
    private readonly logger = new Logger(ClaimRewardService.name);

    constructor(
        private readonly rewardRepository: TierRewardRepositoryPort,
    ) { }

    @Transactional()
    async execute(userId: bigint, rewardId: bigint): Promise<void> {
        const reward = await this.rewardRepository.findById(rewardId);

        if (!reward) {
            throw new NotFoundException('Reward not found');
        }

        if (reward.userId !== userId) {
            throw new BadRequestException('This reward does not belong to the user');
        }

        try {
            // 도메인 엔티티 내 검증 로직 호출 (상태, 만료 체크)
            // 임시 TX ID 생성 (실제 구현 시 WalletService 결과값 사용)
            const walletTxId = 0n; // mock
            reward.claim(walletTxId);

            // TODO: 실제 지갑 지급 연동 (WalletService)
            // const tx = await this.walletService.deposit({
            //     userId,
            //     amount: reward.bonusAmountUsd,
            //     type: TransactionType.TIER_UPGRADE_BONUS,
            //     referenceId: reward.id,
            //     wageringMultiplier: reward.wageringMultiplier,
            // });
            // reward.claim(tx.id);

            await this.rewardRepository.save(reward);

            // UserTier의 lastBonusReceivedAt만 갱신 (선택 사항 - 중복 지급 방지 로직 보완용)
            /* 
            const userTier = await this.userTierRepository.findByUserId(userId);
            if (userTier) {
                userTier.lastBonusReceivedAt = new Date();
                await this.userTierRepository.save(userTier);
            }
            */

            this.logger.log(`User ${userId} claimed premium reward ${rewardId} amount=${reward.bonusAmountUsd}`);
        } catch (e) {
            this.logger.error(`Failed to claim reward ${rewardId} for user ${userId}: ${(e as Error).message}`);
            throw new BadRequestException((e as Error).message);
        }
    }
}
