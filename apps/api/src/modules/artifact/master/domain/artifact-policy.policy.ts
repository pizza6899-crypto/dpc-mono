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
   * - SINGLE, TEN 키가 반드시 존재해야 함
   * - 최소 하나 이상의 유효한 통화(Currency) 가격이 설정되어야 함
   * - 가격은 0 이상의 숫자여야 함
   */
  validateDrawPrices(prices: ArtifactDrawPriceTable): void {
    const requiredTypes: Array<'SINGLE' | 'TEN'> = ['SINGLE', 'TEN'];

    for (const type of requiredTypes) {
      const typePrices = prices[type];

      if (!typePrices || Object.keys(typePrices).length === 0) {
        throw new ArtifactPolicyIncompleteException(type);
      }

      for (const [currency, amount] of Object.entries(typePrices)) {
        if (amount === undefined || amount === null || amount < 0) {
          throw new InvalidArtifactDrawPriceValueException(type, currency, amount as number);
        }
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
