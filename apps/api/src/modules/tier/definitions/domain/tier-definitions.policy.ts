import { Injectable, HttpStatus } from '@nestjs/common';
import { Language } from '@prisma/client';
import { TierDefinitionsException } from './tier-definitions.exception';
import { MessageCode } from '@repo/shared';

/**
 * 티어 정의 도메인 정책 (Policy)
 * 티어 생성, 수정 및 정의 설정과 관련된 비즈니스 규칙을 담당합니다.
 */
@Injectable()
export class TierDefinitionsPolicy {
    /**
     * 티어 번역 데이터의 무결성을 검증합니다.
     * [Rule] 모든 티어는 최종적으로 최소한 일본어(JA)와 영어(EN) 번역을 포함해야 합니다.
     * @param requestedTranslations 이번 요청에서 수정을 요청한 번역 목록
     * @param existingLanguages 현재 DB에 저장되어 있는 언어 목록
     */
    validateTranslations(
        requestedTranslations?: { language: Language }[],
        existingLanguages: Language[] = []
    ): void {
        if (!requestedTranslations) return;

        // 기존 언어들과 요청된 언어들을 합칩니다. (요청된 언어가 기존 언어를 덮어씀)
        const requestedLangs = requestedTranslations.map(t => t.language);
        const finalLanguages = new Set([...existingLanguages, ...requestedLangs]);

        if (!finalLanguages.has(Language.JA) || !finalLanguages.has(Language.EN)) {
            throw new TierDefinitionsException(
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
        upgradeRollingRequiredUsd?: number;
        upgradeDepositRequiredUsd?: number;
        maintainRollingRequiredUsd?: number;
        upgradeBonusUsd?: number;
        compRate?: number;
        weeklyLossbackRate?: number;
        monthlyLossbackRate?: number;
        dailyWithdrawalLimitUsd?: number;
    }): void {
        const {
            upgradeRollingRequiredUsd, upgradeDepositRequiredUsd, maintainRollingRequiredUsd,
            upgradeBonusUsd, compRate, weeklyLossbackRate, monthlyLossbackRate,
            dailyWithdrawalLimitUsd
        } = props;

        // [Rule] 금액 및 요건 관련 수치는 음수일 수 없습니다.
        if (upgradeRollingRequiredUsd !== undefined && upgradeRollingRequiredUsd < 0) this.throwNegativeError('Upgrade Rolling Required USD');
        if (upgradeDepositRequiredUsd !== undefined && upgradeDepositRequiredUsd < 0) this.throwNegativeError('Upgrade Deposit Required USD');
        if (maintainRollingRequiredUsd !== undefined && maintainRollingRequiredUsd < 0) this.throwNegativeError('Maintain Rolling Required USD');
        if (upgradeBonusUsd !== undefined && upgradeBonusUsd < 0) this.throwNegativeError('Upgrade bonus USD');

        // [Rule] 각종 요율(Rate)은 0 이상의 값이어야 합니다.
        if (compRate !== undefined && compRate < 0) this.throwNegativeError('Comp rate');
        if (weeklyLossbackRate !== undefined && weeklyLossbackRate < 0) this.throwNegativeError('Weekly Lossback rate');
        if (monthlyLossbackRate !== undefined && monthlyLossbackRate < 0) this.throwNegativeError('Monthly Lossback rate');

        // [Rule] 한도 관련
        if (dailyWithdrawalLimitUsd !== undefined && dailyWithdrawalLimitUsd < 0) this.throwNegativeError('Daily withdrawal limit');
    }

    private throwNegativeError(fieldName: string): void {
        throw new TierDefinitionsException(
            `${fieldName} cannot be negative.`,
            MessageCode.VALIDATION_ERROR,
            HttpStatus.BAD_REQUEST,
        );
    }

    /**
     * 전체 티어 목록의 정합성을 검증합니다.
     * [Rule 1] 티어 간 level은 중복될 수 없습니다.
     * [Rule 2] 높은 level의 티어는 낮은 level의 티어보다 요구 실적이 크거나 같아야 합니다.
     * @param allTiers 검증할 전체 티어 객체 목록
     */
    validateTierIntegrity(allTiers: {
        level: number;
        upgradeRollingRequiredUsd: { gte: (val: any) => boolean };
        upgradeDepositRequiredUsd: { gte: (val: any) => boolean };
        maintainRollingRequiredUsd: { gte: (val: any) => boolean };
        code: string;
    }[]): void {
        const sortedTiers = [...allTiers].sort((a, b) => a.level - b.level);

        for (let i = 0; i < sortedTiers.length; i++) {
            const current = sortedTiers[i];

            // Rule 1: level 중복 체크
            if (i > 0 && current.level === sortedTiers[i - 1].level) {
                throw new TierDefinitionsException(
                    `Duplicate level detected: ${current.level} (Codes: ${sortedTiers[i - 1].code}, ${current.code})`,
                    MessageCode.VALIDATION_ERROR,
                    HttpStatus.BAD_REQUEST,
                );
            }

            // Rule 2: 요구치 역전 체크 (이전 티어보다 요구치가 낮으면 안됨)
            if (i > 0) {
                const prev = sortedTiers[i - 1];
                if (!current.upgradeRollingRequiredUsd.gte(prev.upgradeRollingRequiredUsd)) {
                    this.throwInversionError('Upgrade Rolling Required USD', current.code, prev.code);
                }
                if (!current.upgradeDepositRequiredUsd.gte(prev.upgradeDepositRequiredUsd)) {
                    this.throwInversionError('Upgrade Deposit Required USD', current.code, prev.code);
                }
                if (!current.maintainRollingRequiredUsd.gte(prev.maintainRollingRequiredUsd)) {
                    this.throwInversionError('Maintain Rolling Required USD', current.code, prev.code);
                }
            }
        }
    }

    private throwInversionError(fieldName: string, higherCode: string, lowerCode: string): void {
        throw new TierDefinitionsException(
            `${fieldName} of higher tier (${higherCode}) cannot be lower than that of lower tier (${lowerCode}).`,
            MessageCode.VALIDATION_ERROR,
            HttpStatus.BAD_REQUEST,
        );
    }
}
