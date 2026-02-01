import { Injectable, HttpStatus } from '@nestjs/common';
import { Language } from '@prisma/client';
import { TierMasterException } from './tier-master.exception';
import { MessageCode } from '@repo/shared';

/**
 * 티어 마스터 도메인 정책 (Policy)
 * 티어 생성, 수정 및 마스터 설정과 관련된 비즈니스 규칙을 담당합니다.
 */
@Injectable()
export class TierMasterPolicy {
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
            throw new TierMasterException(
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
        requirementUsd?: number;
        requirementDepositUsd?: number;
        maintenanceRollingUsd?: number;
        levelUpBonusUsd?: number;
        compRate?: number;
        lossbackRate?: number;
        rakebackRate?: number;
        reloadBonusRate?: number;
        dailyWithdrawalLimitUsd?: number;
    }): void {
        const {
            requirementUsd, requirementDepositUsd, maintenanceRollingUsd,
            levelUpBonusUsd, compRate, lossbackRate, rakebackRate,
            reloadBonusRate, dailyWithdrawalLimitUsd
        } = props;

        // [Rule] 금액 및 요건 관련 수치는 음수일 수 없습니다.
        if (requirementUsd !== undefined && requirementUsd < 0) this.throwNegativeError('Requirement USD');
        if (requirementDepositUsd !== undefined && requirementDepositUsd < 0) this.throwNegativeError('Requirement Deposit USD');
        if (maintenanceRollingUsd !== undefined && maintenanceRollingUsd < 0) this.throwNegativeError('Maintenance Rolling USD');
        if (levelUpBonusUsd !== undefined && levelUpBonusUsd < 0) this.throwNegativeError('Level up bonus USD');

        // [Rule] 각종 요율(Rate)은 0 이상의 값이어야 합니다.
        if (compRate !== undefined && compRate < 0) this.throwNegativeError('Comp rate');
        if (lossbackRate !== undefined && lossbackRate < 0) this.throwNegativeError('Lossback rate');
        if (rakebackRate !== undefined && rakebackRate < 0) this.throwNegativeError('Rakeback rate');
        if (reloadBonusRate !== undefined && reloadBonusRate < 0) this.throwNegativeError('Reload bonus rate');

        // [Rule] 한도 관련
        if (dailyWithdrawalLimitUsd !== undefined && dailyWithdrawalLimitUsd < 0) this.throwNegativeError('Daily withdrawal limit');
    }

    private throwNegativeError(fieldName: string): void {
        throw new TierMasterException(
            `${fieldName} cannot be negative.`,
            MessageCode.VALIDATION_ERROR,
            HttpStatus.BAD_REQUEST,
        );
    }

    /**
     * 전체 티어 목록의 정합성을 검증합니다.
     * [Rule 1] 티어 간 rank는 중복될 수 없습니다.
     * [Rule 2] 높은 rank의 티어는 낮은 rank의 티어보다 요구 실적이 크거나 같아야 합니다.
     * @param allTiers 검증할 전체 티어 객체 목록
     */
    validateTierIntegrity(allTiers: {
        rank: number;
        requirementUsd: { gte: (val: any) => boolean };
        requirementDepositUsd: { gte: (val: any) => boolean };
        maintenanceRollingUsd: { gte: (val: any) => boolean };
        code: string;
    }[]): void {
        const sortedTiers = [...allTiers].sort((a, b) => a.rank - b.rank);

        for (let i = 0; i < sortedTiers.length; i++) {
            const current = sortedTiers[i];

            // Rule 1: rank 중복 체크
            if (i > 0 && current.rank === sortedTiers[i - 1].rank) {
                throw new TierMasterException(
                    `Duplicate rank detected: ${current.rank} (Codes: ${sortedTiers[i - 1].code}, ${current.code})`,
                    MessageCode.VALIDATION_ERROR,
                    HttpStatus.BAD_REQUEST,
                );
            }

            // Rule 2: 요구치 역전 체크 (이전 티어보다 요구치가 낮으면 안됨)
            if (i > 0) {
                const prev = sortedTiers[i - 1];
                if (!current.requirementUsd.gte(prev.requirementUsd)) {
                    this.throwInversionError('Requirement USD', current.code, prev.code);
                }
                if (!current.requirementDepositUsd.gte(prev.requirementDepositUsd)) {
                    this.throwInversionError('Requirement Deposit USD', current.code, prev.code);
                }
                if (!current.maintenanceRollingUsd.gte(prev.maintenanceRollingUsd)) {
                    this.throwInversionError('Maintenance Rolling USD', current.code, prev.code);
                }
            }
        }
    }

    private throwInversionError(fieldName: string, higherCode: string, lowerCode: string): void {
        throw new TierMasterException(
            `${fieldName} of higher tier (${higherCode}) cannot be lower than that of lower tier (${lowerCode}).`,
            MessageCode.VALIDATION_ERROR,
            HttpStatus.BAD_REQUEST,
        );
    }
}
