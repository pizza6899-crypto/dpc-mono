
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { UserTierRepository } from '../../core/infrastructure/user-tier.repository';
import { TierHistoryRepository } from '../infrastructure/repository/tier-history.repository';
import { UserTier } from '../../core/domain/user-tier.entity';
import { Tier } from '../../core/domain/tier.entity';
import { TierChangeType } from '@prisma/client';

@Injectable()
export class PromoteUserService {
    private readonly logger = new Logger(PromoteUserService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly userTierRepository: UserTierRepository,
        private readonly tierHistoryRepository: TierHistoryRepository,
    ) { }

    /**
     * 유저를 특정 Tier로 승급 처리합니다.
     * 트랜잭션 내에서 UserTier 업데이트와 TierHistory 기록을 수행합니다.
     */
    async execute(userId: bigint, targetTier: Tier, changeType: TierChangeType = 'UPGRADE', reason?: string): Promise<void> {
        const userTier = await this.userTierRepository.findByUserId(userId);
        if (!userTier) {
            throw new Error(`UserTier not found for user ${userId}`);
        }

        const currentTier = userTier.tier;
        if (!currentTier) {
            throw new Error(`Current tier info missing for user ${userId}`);
        }

        // 트랜잭션 처리
        await this.prisma.$transaction(async (tx) => {
            // 1. UserTier 업데이트
            // 승급 시: currentPeriodRolling 초기화 여부는 정책에 따라 다름.
            // 보통 승급 직후 새로운 혜택을 적용받으므로, 유지 기간/롤링은 리셋하거나 이어갈 수 있음.
            // 여기서는 "승급 시점"을 lastTierChangedAt으로 갱신하고,
            // highestPromotedPriority를 업데이트함.

            await tx.userTier.update({
                where: { userId },
                data: {
                    tierId: targetTier.id,
                    highestPromotedPriority: targetTier.priority > userTier.highestPromotedPriority
                        ? targetTier.priority
                        : userTier.highestPromotedPriority,
                    lastTierChangedAt: new Date(),
                    // 승급 시 Grace 상태 해제
                    status: 'ACTIVE',
                    graceEndsAt: null,
                }
            });

            // 2. History 기록 (Snapshot)
            // 현재(승급 직전)의 상태를 기록하거나, 승급 후 상태를 기록할 수 있으나,
            // 보통 "어떤 상태에서 변경되었는지"와 "변경된 결과"를 모두 알 수 있어야 함.
            // 여기서는 `toTierId`가 targetTier이므로, `rollingAmountSnap`은 승급 심사 당시의 롤링 금액을 기록.

            await this.tierHistoryRepository.save({
                userId,
                fromTierId: currentTier.id,
                toTierId: targetTier.id,
                changeType,
                reason,

                // Snapshot: 현재 유저의 상태 (승급 자격 증빙)
                rollingAmountSnap: userTier.totalEffectiveRollingUsd.toNumber(),

                // Snapshot: 적용될(혹은 당시의) 요율 정보 - 여기서는 Target Tier의 기본 혜택을 기록하거나, 유저의 커스텀 혜택을 기록
                // *중요*: UserTier에 커스텀 요율이 있다면 그것이 우선됨.
                compRateSnap: userTier.customCompRate?.toNumber() ?? targetTier.compRate.toNumber(),
                lossbackRateSnap: userTier.customLossbackRate?.toNumber() ?? targetTier.lossbackRate.toNumber(),
                rakebackRateSnap: userTier.customRakebackRate?.toNumber() ?? targetTier.rakebackRate.toNumber(),

                // Snapshot: Target Tier의 요구사항 (정책 스냅샷)
                requirementUsdSnap: targetTier.requirementRollingUsd.toNumber(),
                requirementDepositUsdSnap: targetTier.requirementDepositUsd.toNumber(),
                cumulativeDepositUsdSnap: 0, // TODO: 실제 누적 입금액 연동 필요

                // TODO: 승급 보너스 지급 로직 추가 시 여기에 금액 반영
                bonusAmount: 0,
            });
        });

        this.logger.log(`User ${userId} promoted to ${targetTier.name} (from ${currentTier.name})`);
    }
}
