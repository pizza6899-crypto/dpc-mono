import { Inject, Injectable, Logger } from '@nestjs/common';
import { WAGERING_REQUIREMENT_REPOSITORY } from '../ports';
import type { WageringRequirementRepositoryPort } from '../ports';
import { WageringPolicy } from '../domain';
import type { ExchangeCurrencyCode } from '@repo/database';
import { Prisma } from '@repo/database';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

@Injectable()
export class CancelWageringRequirementService {
    private readonly logger = new Logger(CancelWageringRequirementService.name);

    constructor(
        @Inject(WAGERING_REQUIREMENT_REPOSITORY)
        private readonly repository: WageringRequirementRepositoryPort,
        private readonly policy: WageringPolicy,
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly dispatchLogService: DispatchLogService,
    ) { }

    /**
     * 유저의 특정 통화 지갑 잔액을 확인하고, 오링(O-ring) 조건 충족 시 롤링 조건을 취소 처리합니다.
     * @param userId 유저 ID
     * @param currency 통화 코드
     * @param currentTotalBalance 현재 총 잔액 (Main + Bonus)
     */
    async execute(userId: bigint, currency: ExchangeCurrencyCode, currentTotalBalance: Prisma.Decimal): Promise<void> {
        const activeRequirements = await this.repository.findActiveByUserIdAndCurrency(userId, currency);

        if (activeRequirements.length === 0) {
            return;
        }

        for (const requirement of activeRequirements) {
            // cancellationBalanceThreshold가 설정되어 있고, 현재 잔액이 그보다 작으면 취소
            const threshold = requirement.props.cancellationBalanceThreshold;

            if (this.policy.canBeCancelled(currentTotalBalance, threshold)) {
                requirement.cancel(`Insufficient balance (O-ring). Current: ${currentTotalBalance}, Threshold: ${threshold}`);
                await this.repository.save(requirement);

                // Explicit Audit Log Dispatch
                await this.dispatchLogService.dispatch({
                    type: LogType.ACTIVITY,
                    data: {
                        userId: userId.toString(),
                        category: 'WAGERING',
                        action: 'CANCEL_WAGERING_REQUIREMENT',
                        metadata: {
                            wageringId: requirement.id?.toString(),
                            reason: 'O_RING',
                            currentTotalBalance: currentTotalBalance.toString(),
                            threshold: threshold?.toString(),
                        }
                    }
                });

                this.logger.log(`Wagering requirement ${requirement.id} cancelled due to O-ring logic.`);
            }
        }
    }
}
