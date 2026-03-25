import { Injectable } from '@nestjs/common';
import { ArtifactDrawConfig } from './artifact-draw-config.entity';
import {
  ArtifactGradesIncompleteException,
  ArtifactProbabilitySumException,
} from './master.exception';

/**
 * [Artifact] 유물 뽑기 설정과 관련된 도메인 비즈니스 로직 처리 정책 (Rule)
 */
@Injectable()
export class ArtifactDrawConfigPolicy {
  /**
   * 전체 등급에 대한 확률 설정 무결성 검증
   * - 모든 등급이 포함되어야 함
   * - 모든 확률의 총합이 1.0(100.0%)이어야 함
   */
  validateDrawConfigs(
    configs: ArtifactDrawConfig[], // 수정된 최종 리스트
    totalGradesCount: number, // 기대되는 총 등급 개수
  ): void {
    // 1. 개수 및 중복 검증 (모든 등급 포함 여부)
    const gradeSet = new Set(configs.map((c) => c.grade));
    if (configs.length !== totalGradesCount || gradeSet.size !== totalGradesCount) {
      throw new ArtifactGradesIncompleteException(totalGradesCount, gradeSet.size);
    }

    // 2. 전체 합계 검증 (총합 정합성)
    const totalProb = configs.reduce(
      (sum, c) => sum + c.probability.toNumber(),
      0,
    );

    // 부동소수점 오차 감안 (0.00001 범위 내 1.0 체크)
    if (Math.abs(totalProb - 1.0) > 0.00001) {
      throw new ArtifactProbabilitySumException(totalProb);
    }
  }
}
