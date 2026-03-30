import { ArtifactGrade } from '@prisma/client';
import { ArtifactDrawConfig } from '../../master/domain/artifact-draw-config.entity';
import { ArtifactCatalog } from '../../master/domain/artifact-catalog.entity';
import { NoArtifactsForGradeException } from '../../master/domain/master.exception';

/**
 * [Artifact Draw] 유물 뽑기 결과 결정을 위한 도메인 정책 (Domain Service 역할)
 *
 * 뽑기 횟수 산정, 등급 주사위 굴리기, 아이템 선택 등의 순수 비즈니스 로직을 담당합니다.
 */
export class ArtifactDrawPolicy {
  /**
   * [Rule] 뽑기 타입에 따른 실제 획득 수량 결정 (10+1 정책)
   */
  getDrawCount(type: 'SINGLE' | 'TEN'): number {
    return type === 'SINGLE' ? 1 : 11;
  }

  /**
   * [Rule] 설정된 확률(Gacha Config)에 따라 당첨 등급을 결정합니다.
   * 특정 등급 확정권 사용 시 guaranteedGrade를 인자로 전달합니다.
   */
  rollGrade(configs: ArtifactDrawConfig[], guaranteedGrade?: ArtifactGrade): ArtifactGrade {
    if (guaranteedGrade) {
      return guaranteedGrade;
    }
    // 등급 순서대로 정렬 (가시적인 누적 확률 계산을 위해)
    const order = Object.values(ArtifactGrade);
    const sortedConfigs = [...configs].sort((a, b) => order.indexOf(a.grade) - order.indexOf(b.grade));

    const roll = Math.random();
    let cumulative = 0;

    for (const config of sortedConfigs) {
      cumulative += Number(config.probability);
      if (roll <= cumulative) {
        return config.grade;
      }
    }

    // 만약 확률 합계가 1 미만이라면 기본적으로 가장 낮은 등급 반환
    return ArtifactGrade.COMMON;
  }

  /**
   * [Rule] 결정된 등급의 풀에서 특정 유물을 무작위로 선택합니다.
   * (추후 각 유물별 가중치(drawWeight)가 도입될 경우 여기서 해당 로직을 처리)
   */
  selectArtifactFromPool(pool: ArtifactCatalog[], grade: ArtifactGrade): ArtifactCatalog {
    const gradePool = pool.filter(a => a.grade === grade);

    if (gradePool.length === 0) {
      throw new NoArtifactsForGradeException(grade);
    }

    // [Simple Random] 현재는 동일 가중치로 무작위 선택
    // TODO: ArtifactCatalog.drawWeight 필드를 활용한 가중치 랜덤 로직 적용 가능
    const totalWeight = gradePool.reduce((sum, item) => sum + (item.drawWeight || 1000), 0);
    const roll = Math.random() * totalWeight;

    let currentWeight = 0;
    for (const item of gradePool) {
      currentWeight += (item.drawWeight || 1000);
      if (roll <= currentWeight) {
        return item;
      }
    }

    return gradePool[Math.floor(Math.random() * gradePool.length)];
  }
}
