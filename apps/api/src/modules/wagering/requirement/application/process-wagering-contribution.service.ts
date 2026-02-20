import { Inject, Injectable, Logger } from '@nestjs/common';
import { WAGERING_REQUIREMENT_REPOSITORY, WAGERING_CONTRIBUTION_LOG_REPOSITORY } from '../ports';
import type { WageringRequirementRepositoryPort, WageringContributionLogRepositoryPort } from '../ports';
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

interface ProcessWageringContributionCommand {
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
        @Inject(WAGERING_CONTRIBUTION_LOG_REPOSITORY)
        private readonly logRepository: WageringContributionLogRepositoryPort,
        private readonly policy: WageringPolicy,
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly dispatchLogService: DispatchLogService,
        private readonly getConfigService: GetWageringConfigService,
        private readonly settleService: SettleWageringRequirementService,
    ) { }

    @Transactional()
    async execute(command: ProcessWageringContributionCommand): Promise<void> {
        const { userId, currency, gameRoundId, betAmount, gameContributionRate = 1.0 } = command;

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
            if (requirement.targetType === 'AMOUNT' && remainingContribution.lte(0)) continue;

            let contributedForThis = new Prisma.Decimal(0);
            let incrementedCount = 0;

            if (requirement.targetType === 'AMOUNT') {
                contributedForThis = requirement.contributeAmount(remainingContribution, betAmount);
                if (contributedForThis.gt(0)) {
                    remainingContribution = remainingContribution.sub(contributedForThis);
                }
            } else if (requirement.targetType === 'ROUND_COUNT') {
                incrementedCount = requirement.contributeRound(betAmount);
            }

            if (contributedForThis.gt(0) || incrementedCount > 0) {
                // 1. 변경된 롤링 조건 엔티티 상태 저장
                await this.repository.save(requirement);

                // 2. 기여 상세 로그 생성 (별도 메서드로 분리)
                await this.logRepository.create({
                    wageringRequirementId: requirement.id,
                    gameRoundId,
                    requestAmount: totalRequestAmount,
                    contributionRate: new Prisma.Decimal(gameContributionRate),
                    wageredAmount: contributedForThis, // COUNT 방식일 경우 0이 기록됨
                });

                if (requirement.isFulfilled) {
                    try {
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
                                    wageringId: requirement.id.toString(), // sqid로 변환은 컨트롤러 레벨에서 수행되므로 여기선 toString
                                    currency,
                                    finalAmount: requirement.targetType === 'AMOUNT' ? requirement.wageredAmount.toString() : requirement.wageredCount.toString(),
                                    convertedAmount: requirement.convertedAmount?.toString() ?? '0',
                                    gameRoundId: gameRoundId.toString(),
                                }
                            }
                        });
                    } catch (error) {
                        this.logger.error(
                            `Failed to settle wagering requirement ${requirement.id} after fulfillment. This does not affect contribution processing.`,
                            error instanceof Error ? error.stack : String(error),
                        );
                        // 정산 실패 알림 로직 추가 가능 (예: 슬랙 알림 등)
                    }
                }

                this.logger.log(
                    `Wagering requirement ${requirement.id} contributed: ${requirement.targetType === 'AMOUNT' ? contributedForThis : incrementedCount + ' rounds'} (Remaining to contribute: ${remainingContribution})`
                );
            }
        }
    }
}
