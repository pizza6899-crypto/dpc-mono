import { Injectable } from '@nestjs/common';
import { ArtifactDrawPriceTable, ArtifactSynthesisConfigTable } from './artifact-policy.entity';
import { ArtifactPolicyIncompleteException, InvalidArtifactDrawPriceValueException, InvalidArtifactSynthesisGuaranteedCountException, InvalidArtifactSynthesisRequiredCountException, InvalidArtifactSynthesisSuccessRateException } from './master.exception';

/**
 * [Artifact] 유물 기본 정책과 관련된 도메인 비즈니스 로직 처리 정책 (Rule)
 */
@Injectable()
export class ArtifactPolicyPolicy {
  /**
   * 뽑기 비용 테이블 유효성 검증
   * - SINGLE 가격 정보가 반드시 존재해야 함 (TEN은 코드 내에서 10배 자동 계산)
   * - 최소 하나 이상의 유효한 통화(Currency) 가격이 설정되어야 함
   * - 가격은 0 이상의 숫자여야 함
   */
  validateDrawPrices(prices: ArtifactDrawPriceTable): void {
    const singlePrices = prices.SINGLE;

    // 1. SINGLE 가격 자체가 없거나 빈 객체인 경우
    if (!singlePrices || Object.keys(singlePrices).length === 0) {
      throw new ArtifactPolicyIncompleteException('SINGLE');
    }

    // 2. 각 통화별 가격 값의 유효성 검증
    for (const [currency, amount] of Object.entries(singlePrices)) {
      if (amount === undefined || amount === null || typeof amount !== 'number' || amount < 0) {
        throw new InvalidArtifactDrawPriceValueException('SINGLE', (currency as any), amount as number);
      }
    }
  }

  /**
   * 합성 설정 테이블 유효성 검증
   * - requiredCount > 0
   * - successRate 0.0 ~ 1.0
   * - guaranteedCount > 0 (값이 있을 경우)
   */
  validateSynthesisConfigs(configs: ArtifactSynthesisConfigTable): void {
    for (const [grade, config] of Object.entries(configs)) {
      if (!config) continue;

      if (config.requiredCount <= 0) {
        throw new InvalidArtifactSynthesisRequiredCountException(grade, config.requiredCount);
      }

      if (config.successRate < 0 || config.successRate > 1.0) {
        throw new InvalidArtifactSynthesisSuccessRateException(grade, config.successRate);
      }

      if (config.guaranteedCount !== undefined && config.guaranteedCount <= 0) {
        throw new InvalidArtifactSynthesisGuaranteedCountException(grade, config.guaranteedCount);
      }
    }
  }
}
