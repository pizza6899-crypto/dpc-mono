import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { WAGERING_REQUIREMENT_REPOSITORY } from '../ports/wagering-requirement.repository.port';
import type { WageringRequirementRepositoryPort } from '../ports/wagering-requirement.repository.port';
import { UpdateUserBalanceService } from '../../../wallet/application/update-user-balance.service';
import { FindUserWalletService } from '../../../wallet/application/find-user-wallet.service';
import {
    UserWalletBalanceType,
    UserWalletTransactionType,
    ExchangeCurrencyCode
} from '@prisma/client';
import { UpdateOperation } from '../../../wallet/domain';
import { WageringRequirementNotFoundException } from '../domain/wagering-requirement.exception';
import { WalletNotFoundException } from '../../../wallet/domain';
import { Prisma } from '@prisma/client';

export interface SettleWageringRequirementCommand {
    requirementId: bigint;
    adminUserId?: bigint; // 자동 정산일 경우 null
}

@Injectable()
export class SettleWageringRequirementService {
    private readonly logger = new Logger(SettleWageringRequirementService.name);

    constructor(
        @Inject(WAGERING_REQUIREMENT_REPOSITORY)
        private readonly repository: WageringRequirementRepositoryPort,
        private readonly updateBalanceService: UpdateUserBalanceService,
        private readonly findWalletService: FindUserWalletService,
    ) { }

    @Transactional()
    async execute(command: SettleWageringRequirementCommand): Promise<void> {
        const { requirementId } = command;

        // 1. 요구사항 조회
        const requirement = await this.repository.findById(requirementId);
        if (!requirement) {
            throw new WageringRequirementNotFoundException(requirementId);
        }

        // 2. 이미 완료되었거나 취소된 경우 스킵
        if (!requirement.isActive) {
            this.logger.warn(`Wagering requirement ${requirementId} is already ${requirement.status}. Skipping settlement.`);
            return;
        }

        // 3. 롤링 충족 여부 최종 확인
        if (!requirement.isFulfilled) {
            this.logger.warn(`Wagering requirement ${requirementId} is not fulfilled yet. Skipping settlement.`);
            return;
        }

        const userId = requirement.userId;
        const currency = requirement.currency as ExchangeCurrencyCode;

        // 4. 유저 지갑 상태 조회
        const wallet = await this.findWalletService.findWallet(userId, currency);
        if (!wallet) {
            throw new WalletNotFoundException(userId, currency);
        }

        const currentBonus = wallet.bonus;

        if (currentBonus.isZero()) {
            this.logger.log(`User ${userId} has zero bonus balance. Completing requirement ${requirementId} without conversion.`);
            requirement.complete(new Prisma.Decimal(0));
            await this.repository.save(requirement);
            return;
        }

        // 5. 정산 금액 계산 (Max Cash Conversion 적용)
        let conversionAmount = currentBonus;
        if (requirement.maxCashConversion && requirement.maxCashConversion.greaterThan(0)) {
            conversionAmount = Prisma.Decimal.min(currentBonus, requirement.maxCashConversion);
        }

        this.logger.log(`Settling WageringRequirement ${requirementId}: Bonus ${currentBonus} -> Cash ${conversionAmount}`);

        // 6. 지갑 업데이트 (Atomic Transaction)
        // 6.1. 보너스 잔액 전액 회수
        await this.updateBalanceService.updateBalance({
            userId,
            currency,
            amount: currentBonus,
            operation: UpdateOperation.SUBTRACT,
            balanceType: UserWalletBalanceType.BONUS,
            transactionType: UserWalletTransactionType.BONUS_OUT,
            referenceId: requirementId,
        }, {
            internalNote: `Bonus settlement for requirement: ${requirementId}`,
        });

        // 6.2. 전환 금액만큼 현금 지급
        if (conversionAmount.greaterThan(0)) {
            await this.updateBalanceService.updateBalance({
                userId,
                currency,
                amount: conversionAmount,
                operation: UpdateOperation.ADD,
                balanceType: UserWalletBalanceType.CASH,
                transactionType: UserWalletTransactionType.BONUS_CONVERSION,
                referenceId: requirementId,
            }, {
                internalNote: `Cash conversion from requirement: ${requirementId}`,
            });
        }

        // 7. 엔티티 상태 업데이트 및 저장
        requirement.complete(conversionAmount);
        await this.repository.save(requirement);

        this.logger.log(`Wagering settlement completed for user ${userId}, requirement ${requirementId}`);
    }
}
