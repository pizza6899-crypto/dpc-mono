import { Injectable, HttpStatus } from '@nestjs/common';
import { Language, Prisma } from '@prisma/client';
import { TierConfigException } from './tier-config.exception';
import { MessageCode } from '@repo/shared';

/**
 * 티어 정의 도메인 정책 (Policy)
 * 티어 생성, 수정 및 정의 설정과 관련된 비즈니스 규칙을 담당합니다.
 */
@Injectable()
export class TierConfigPolicy {
  /**
   * 티어 번역 데이터의 무결성을 검증합니다.
   * [Rule] 모든 티어는 최종적으로 최소한 일본어(JA)와 영어(EN) 번역을 포함해야 합니다.
   */
  validateTranslations(
    requestedTranslations?: { language: Language }[],
    existingLanguages: Language[] = [],
  ): void {
    if (!requestedTranslations) return;

    const requestedLangs = requestedTranslations.map((t) => t.language);
    const finalLanguages = new Set([...existingLanguages, ...requestedLangs]);

    if (!finalLanguages.has(Language.JA) || !finalLanguages.has(Language.EN)) {
      throw new TierConfigException(
        'The final state of translations must include at least JA (Japanese) and EN (English).',
        MessageCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 티어 수정 시 입력 데이터의 유효성을 검증합니다.
   */
  validateUpdateProps(props: {
    upgradeExpRequired?: bigint;
    compRate?: number | Prisma.Decimal;
    weeklyLossbackRate?: number | Prisma.Decimal;
    monthlyLossbackRate?: number | Prisma.Decimal;
    dailyWithdrawalLimitUsd?: number | Prisma.Decimal;
    weeklyWithdrawalLimitUsd?: number | Prisma.Decimal;
    monthlyWithdrawalLimitUsd?: number | Prisma.Decimal;
    expGrantRollingUsd?: number | Prisma.Decimal;
  }): void {
    const {
      upgradeExpRequired,
      compRate,
      weeklyLossbackRate,
      monthlyLossbackRate,
      dailyWithdrawalLimitUsd,
      weeklyWithdrawalLimitUsd,
      monthlyWithdrawalLimitUsd,
      expGrantRollingUsd,
    } = props;

    // [Rule] 수치는 음수일 수 없습니다.
    if (upgradeExpRequired !== undefined && upgradeExpRequired < 0n)
      this.throwNegativeError('Upgrade Exp Required');

    if (compRate !== undefined && new Prisma.Decimal(compRate as any).lt(0))
      this.throwNegativeError('Comp rate');
    if (
      weeklyLossbackRate !== undefined &&
      new Prisma.Decimal(weeklyLossbackRate as any).lt(0)
    )
      this.throwNegativeError('Weekly Lossback rate');
    if (
      monthlyLossbackRate !== undefined &&
      new Prisma.Decimal(monthlyLossbackRate as any).lt(0)
    )
      this.throwNegativeError('Monthly Lossback rate');

    if (
      dailyWithdrawalLimitUsd !== undefined &&
      new Prisma.Decimal(dailyWithdrawalLimitUsd as any).lt(0)
    )
      this.throwNegativeError('Daily withdrawal limit');
    if (
      weeklyWithdrawalLimitUsd !== undefined &&
      new Prisma.Decimal(weeklyWithdrawalLimitUsd as any).lt(0)
    )
      this.throwNegativeError('Weekly withdrawal limit');
    if (
      monthlyWithdrawalLimitUsd !== undefined &&
      new Prisma.Decimal(monthlyWithdrawalLimitUsd as any).lt(0)
    )
      this.throwNegativeError('Monthly withdrawal limit');

    if (
      expGrantRollingUsd !== undefined &&
      new Prisma.Decimal(expGrantRollingUsd as any).lte(0)
    ) {
      throw new TierConfigException(
        'Exp Grant Rolling USD must be greater than 0.',
        MessageCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private throwNegativeError(fieldName: string): void {
    throw new TierConfigException(
      `${fieldName} cannot be negative.`,
      MessageCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
    );
  }

  /**
   * 전체 티어 목록의 정합성을 검증합니다.
   * [Rule 1] 티어 간 level은 중복될 수 없습니다.
   * [Rule 2] 높은 level의 티어는 낮은 level의 티어보다 요구 XP가 크거나 같아야 합니다.
   */
  validateTierIntegrity(
    allTiers: {
      level: number;
      upgradeExpRequired: bigint;
      code: string;
    }[],
  ): void {
    const sortedTiers = [...allTiers].sort((a, b) => a.level - b.level);

    for (let i = 0; i < sortedTiers.length; i++) {
      const current = sortedTiers[i];

      if (i > 0 && current.level === sortedTiers[i - 1].level) {
        throw new TierConfigException(
          `Duplicate level detected: ${current.level} (Codes: ${sortedTiers[i - 1].code}, ${current.code})`,
          MessageCode.VALIDATION_ERROR,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (i > 0) {
        const prev = sortedTiers[i - 1];
        if (current.upgradeExpRequired < prev.upgradeExpRequired) {
          this.throwInversionError(
            'Upgrade Exp Required',
            current.code,
            prev.code,
          );
        }
      }
    }
  }

  private throwInversionError(
    fieldName: string,
    higherCode: string,
    lowerCode: string,
  ): void {
    throw new TierConfigException(
      `${fieldName} of higher tier (${higherCode}) cannot be lower than that of lower tier (${lowerCode}).`,
      MessageCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
    );
  }
}
