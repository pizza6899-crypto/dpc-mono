import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { TierRewardRepositoryPort } from '../infrastructure/tier-reward.repository.port';
import { RewardNotFoundException, RewardOwnerMismatchException } from '../domain/tier-reward.exception';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { UpdateUserBalanceService } from 'src/modules/wallet/application/update-user-balance.service';
import { CreateWageringRequirementService } from 'src/modules/wagering/application/create-wagering-requirement.service';
import { ExchangeCurrencyCode, UserWalletBalanceType, UserWalletTransactionType, WageringSourceType, Prisma } from '@prisma/client';
import { WalletActionName, UpdateOperation } from 'src/modules/wallet/domain';

import { ExchangeRateService } from 'src/modules/exchange/application/exchange-rate.service';

@Injectable()
export class ClaimRewardService {
    private readonly logger = new Logger(ClaimRewardService.name);

    constructor(
        private readonly rewardRepository: TierRewardRepositoryPort,
        private readonly advisoryLockService: AdvisoryLockService,
        private readonly updateBalanceService: UpdateUserBalanceService,
        private readonly createWageringService: CreateWageringRequirementService,
        private readonly exchangeRateService: ExchangeRateService,
    ) { }

    @Transactional()
    async execute(userId: bigint, rewardId: bigint, targetCurrency: ExchangeCurrencyCode = ExchangeCurrencyCode.USD): Promise<void> {
        // [락 적용] 유저별 보상 청구 동시성 제어 (중복 클릭 방지)
        await this.advisoryLockService.acquireLock(
            LockNamespace.TIER_REWARD,
            userId.toString()
        );

        const reward = await this.rewardRepository.findById(rewardId);

        if (!reward) {
            throw new RewardNotFoundException();
        }

        if (reward.userId !== userId) {
            throw new RewardOwnerMismatchException();
        }

        try {
            // 1. 환율 정보 계산 (지급 전 스냅샷용)
            const usdAmount = reward.bonusAmountUsd;
            let finalAmount = usdAmount;
            let exchangeRate = new Prisma.Decimal(1);

            if (targetCurrency !== ExchangeCurrencyCode.USD) {
                exchangeRate = await this.exchangeRateService.getRate({
                    fromCurrency: ExchangeCurrencyCode.USD,
                    toCurrency: targetCurrency,
                });
                finalAmount = usdAmount.mul(exchangeRate);
                this.logger.debug(`Converting reward ${rewardId} from ${usdAmount} USD to ${finalAmount} ${targetCurrency} (rate: ${exchangeRate})`);
            }

            // 2. 도메인 엔티티 내 검증 및 상태 변경 (스냅샷 기록)
            reward.claim({
                walletTxId: 0n, // 지갑 지급 후 업데이트 (또는 referenceId로 연결)
                currency: targetCurrency,
                amount: finalAmount,
                rate: exchangeRate,
            });

            // 3. 지갑 지급 처리
            const isCash = reward.wageringMultiplier.isZero(); // 배율이 0이면 즉시 출금 가능한 캐시

            const wallet = await this.updateBalanceService.updateBalance({
                userId,
                currency: targetCurrency,
                amount: finalAmount,
                operation: UpdateOperation.ADD,
                balanceType: isCash ? UserWalletBalanceType.CASH : UserWalletBalanceType.BONUS,
                transactionType: UserWalletTransactionType.BONUS_IN,
                referenceId: reward.id,
                amountUsd: usdAmount,
            }, {
                actionName: WalletActionName.CLAIM_TIER_REWARD,
                internalNote: `Tier Reward Claim: ${reward.fromLevel} -> ${reward.toLevel} (Converted to ${targetCurrency})`,
            });

            // 3. 베팅 요구 조건 생성 (보너스인 경우)
            if (!isCash) {
                const requiredAmount = finalAmount.mul(reward.wageringMultiplier);
                await this.createWageringService.execute({
                    userId,
                    currency: targetCurrency,
                    sourceType: WageringSourceType.PROMOTION_BONUS,
                    requiredAmount,
                    expiresAt: reward.expiresAt || undefined,
                });
            }

            // 4. 보상 엔티티에 최종 트랜잭션 ID 기록 및 저장
            await this.rewardRepository.save(reward);

            this.logger.log(`User ${userId} claimed tier reward ${rewardId} amount=${finalAmount} ${targetCurrency} (isCash=${isCash})`);
        } catch (e) {
            this.logger.error(`Failed to claim reward ${rewardId} for user ${userId}: ${(e as Error).message}`);
            // 도메인 익셉션이 아닌 일반 에러인 경우 BadRequest로 래핑
            if (e instanceof BadRequestException) throw e;
            throw new BadRequestException((e as Error).message);
        }
    }
}
