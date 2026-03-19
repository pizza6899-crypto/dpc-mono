import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  WAGERING_REQUIREMENT_REPOSITORY,
  WAGERING_CONTRIBUTION_LOG_REPOSITORY,
} from '../ports';
import type {
  WageringRequirementRepositoryPort,
  WageringContributionLogRepositoryPort,
} from '../ports';
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
  ) {}

  @Transactional()
  async execute(command: ProcessWageringContributionCommand): Promise<void> {
    const {
      userId,
      currency,
      gameRoundId,
      betAmount,
      gameContributionRate = 1.0,
    } = command;

    // 0. 베팅 금액이 0보다 작거나 같으면 무시
    if (betAmount.lte(0)) {
      return;
    }

    // 0.1 글로벌 설정 및 활성 롤링 조건 조회
    const [config, activeRequirements] = await Promise.all([
      this.getConfigService.execute(),
      this.repository.findActiveByUserIdAndCurrency(userId, currency),
    ]);

    if (activeRequirements.length === 0) {
      return;
    }

    // 0.2 최소/최대 베팅 기여 범위 체크 (글로벌 설정)
    const setting = config.getSetting(currency);
    const isBelowMinBet = betAmount.lessThan(setting.minBetAmount);

    // 0.3 최대 기여 한도 적용 (Capping)
    const effectiveBetForContribution =
      !setting.maxBetAmount.isZero() &&
      betAmount.greaterThan(setting.maxBetAmount)
        ? setting.maxBetAmount
        : betAmount;

    // 1. 가중치가 적용된 기본 기여액 계산 (WEIGHTED 방식용)
    const weightedContribution = this.policy.calculateContribution(
      effectiveBetForContribution,
      gameContributionRate,
    );

    // 잔여 기여 가능액 추적 (동일 유저의 여러 WEIGHTED 조건을 순차 차감할 때 사용)
    let remainingWeightedContribution = weightedContribution;

    this.logger.debug(
      `Processing wagering contribution for user ${userId}: Bet ${betAmount}, Rate ${gameContributionRate}, Effective(Capped) ${effectiveBetForContribution}, Weighted ${weightedContribution}`,
    );

    // 3. 순차적으로 차감 및 베팅 기록
    for (const requirement of activeRequirements) {
      // ✅ 필터와 상관없이 모든 베팅 활동 기록 (자금 소모 및 누적액 합산)
      requirement.recordActivity(betAmount);

      let contributionForThis = new Prisma.Decimal(0);
      let incrementedCount = 0;

      // 최소 베팅 금액 미달 시 롤링 기여(Progress)만 건너뜀
      if (!isBelowMinBet) {
        // 3.1 계산 방식에 따른 기여액 결정
        if (requirement.targetType === 'AMOUNT') {
          const amountToContribute =
            requirement.calculationMethod === 'FULL'
              ? effectiveBetForContribution // FULL 방식은 100% 인정
              : remainingWeightedContribution; // WEIGHTED 방식은 가중치 적용 및 잔액 추적

          if (amountToContribute.gt(0)) {
            contributionForThis = requirement.contributeAmount(
              amountToContribute,
              betAmount,
            );

            // WEIGHTED 방식인 경우 사용한 만큼 잔액에서 차감
            if (
              requirement.calculationMethod === 'WEIGHTED' &&
              contributionForThis.gt(0)
            ) {
              remainingWeightedContribution =
                remainingWeightedContribution.sub(contributionForThis);
            }
          }
        } else if (requirement.targetType === 'ROUND_COUNT') {
          incrementedCount = requirement.contributeRound(betAmount);
        }
      }

      // 상태 저장 (기여분이 없더라도 recordActivity로 인해 상태가 변경됨)
      await this.repository.save(requirement);

      if (contributionForThis.gt(0) || incrementedCount > 0) {
        // 2. 기여 상세 로그 생성
        await this.logRepository.create({
          wageringRequirementId: requirement.id,
          gameRoundId,
          requestAmount: betAmount,
          contributionRate:
            requirement.calculationMethod === 'FULL'
              ? new Prisma.Decimal(1) // FULL 방식은 기여도 100%로 기록
              : new Prisma.Decimal(gameContributionRate),
          wageredAmount: contributionForThis,
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
                  finalAmount:
                    requirement.targetType === 'AMOUNT'
                      ? requirement.wageredAmount.toString()
                      : requirement.wageredCount.toString(),
                  convertedAmount:
                    requirement.convertedAmount?.toString() ?? '0',
                  gameRoundId: gameRoundId.toString(),
                },
              },
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
          `Wagering requirement ${requirement.id} contributed: ${requirement.targetType === 'AMOUNT' ? contributionForThis : incrementedCount + ' rounds'} (Remaining Weighted: ${remainingWeightedContribution})`,
        );
      }
    }
  }
}
