import { Inject, Injectable, Logger } from '@nestjs/common';
import { WAGERING_REQUIREMENT_REPOSITORY } from '../ports';
import type { WageringRequirementRepositoryPort } from '../ports';
import { WageringPolicy } from '../domain';
import type { ExchangeCurrencyCode } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { GetWageringConfigService } from '../../config/application/get-wagering-config.service';
import { SettleWageringRequirementService } from './settle-wagering-requirement.service';
import { Transactional } from '@nestjs-cls/transactional';

interface ProcessWageringContributionParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    gameRoundId: bigint;
    betAmount: Prisma.Decimal;
    gameContributionRate?: number; // 1.0 = 100%, 0.1 = 10%
}

@Injectable()
export class ProcessWageringContributionService {
    private readonly logger = new Logger(ProcessWageringContributionService.name);

    constructor(
        @Inject(WAGERING_REQUIREMENT_REPOSITORY)
        private readonly repository: WageringRequirementRepositoryPort,
        private readonly policy: WageringPolicy,
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly dispatchLogService: DispatchLogService,
        private readonly getConfigService: GetWageringConfigService,
        private readonly settleService: SettleWageringRequirementService,
    ) { }

    @Transactional()
    async execute(params: ProcessWageringContributionParams): Promise<void> {
        const { userId, currency, gameRoundId, betAmount, gameContributionRate = 1.0 } = params;

        // 0. 베팅 금액이 0보다 작거나 같으면 무시
        if (betAmount.lte(0)) {
            return;
        }

        // 0.1 최소/최대 베팅 기여 범위 체크 (글로벌 설정)
        const config = await this.getConfigService.execute();
        const setting = config.getSetting(currency);

        if (betAmount.lessThan(setting.minBetAmount)) {
            this.logger.debug(`Bet amount ${betAmount} is less than minBet ${setting.minBetAmount} for ${currency}. Skipping contribution.`);
            return;
        }

        // 0.2 최대 기여 한도 적용 (Capping)
        // 실제 베팅액이 설정된 maxBetLimit보다 크면 한도까지만 기여액으로 산정
        const effectiveBetForContribution = (!setting.maxBetAmount.isZero() && betAmount.greaterThan(setting.maxBetAmount))
            ? setting.maxBetAmount
            : betAmount;

        // 1. 활성 롤링 조건 조회 (우선순위 DESC, 생성일 ASC)
        const activeRequirements = await this.repository.findActiveByUserIdAndCurrency(userId, currency);

        if (activeRequirements.length === 0) {
            return;
        }

        // 2. 실제 반영될 금액 계산 (게임별 기여도 적용)
        // 예: 10,000원 베팅(한도 5,000원 적용 시) * 50% = 2,500원 반영
        let remainingContribution = this.policy.calculateContribution(effectiveBetForContribution, gameContributionRate);

        // 원래 요청된 금액 (로그용)
        const totalRequestAmount = betAmount;

        this.logger.debug(
            `Processing wagering contribution for user ${userId}: Bet ${betAmount}, Rate ${gameContributionRate}, Effective ${remainingContribution}`
        );

        // 3. 순차적으로 차감
        for (const requirement of activeRequirements) {
            if (remainingContribution.lte(0)) break;

            // 해당 조건에 반영할 수 있는 최대 금액 확인 및 차감
            // contribute 메서드는 실제 반영된 금액을 리턴하고, 내부 상태를 업데이트함
            const contributedForThis = requirement.contribute(remainingContribution);

            if (contributedForThis.gt(0)) {
                // 남은 기여액 업데이트
                remainingContribution = remainingContribution.sub(contributedForThis);

                // 변경 사항 저장 및 로그 생성
                await this.repository.save(requirement, {
                    gameRoundId,
                    requestAmount: totalRequestAmount,
                    contributionRate: new Prisma.Decimal(gameContributionRate),
                    contributedAmount: contributedForThis,
                });

                if (requirement.isFulfilled) {
                    // 1. 실제 정산 처리 (지갑 잔액 전환 및 상태 업데이트)
                    await this.settleService.execute({ requirementId: requirement.id });

                    // 2. 감사 로그 디스패치 (정산 후 최신 상태 반영)
                    await this.dispatchLogService.dispatch({
                        type: LogType.ACTIVITY,
                        data: {
                            userId: userId.toString(),
                            category: 'WAGERING',
                            action: 'COMPLETE_WAGERING_REQUIREMENT',
                            metadata: {
                                wageringId: requirement.id?.toString(),
                                currency,
                                finalAmount: requirement.fulfilledAmount.toString(),
                                convertedAmount: requirement.convertedAmount?.toString(),
                                gameRoundId: gameRoundId.toString(),
                            }
                        }
                    });
                }

                this.logger.log(
                    `Wagering requirement ${requirement.id} contributed: ${contributedForThis} (Remaining to contribute: ${remainingContribution})`
                );
            }
        }
    }
}
