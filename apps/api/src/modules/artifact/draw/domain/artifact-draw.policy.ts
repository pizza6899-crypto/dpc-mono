import { createHash } from 'crypto';
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
   * [Method 2] 사용한 난수를 0 ~ 1 범위로 재생산(Normalization)하여 반환합니다.
   */
  rollGrade(configs: ArtifactDrawConfig[], seed: string, guaranteedGrade?: ArtifactGrade): { grade: ArtifactGrade; remappedRoll: number; rawRoll: number } {
    const rawRoll = this.generateRandomFromSeed(seed);

    // 등급 확정권 사용 시
    if (guaranteedGrade) {
      return { grade: guaranteedGrade, remappedRoll: rawRoll, rawRoll };
    }

    const order = Object.values(ArtifactGrade);
    const sortedConfigs = [...configs].sort((a, b) => order.indexOf(a.grade) - order.indexOf(b.grade));

    let cumulative = 0;
    for (const config of sortedConfigs) {
      const prob = Number(config.probability);
      const nextCumulative = cumulative + prob;

      if (rawRoll <= nextCumulative) {
        // [Normalization] (현재난수 - 구간시작) / 구간길이 = 0 ~ 1 사이의 새로운 난수 탄생
        const remapped = prob > 0 ? (rawRoll - cumulative) / prob : 0;
        return { grade: config.grade, remappedRoll: Math.min(Math.max(remapped, 0), 1), rawRoll };
      }
      cumulative = nextCumulative;
    }

    return { grade: ArtifactGrade.COMMON, remappedRoll: rawRoll, rawRoll };
  }

  /**
   * [Rule] 결정된 등급의 풀에서 특정 유물을 무작위로 선택합니다.
   * @param roll 0 ~ 1 사이의 재생산된 난수 (remappedRoll)
   */
  selectArtifactFromPool(pool: ArtifactCatalog[], grade: ArtifactGrade, roll: number): ArtifactCatalog {
    const gradePool = pool.filter(a => a.grade === grade);

    if (gradePool.length === 0) {
      throw new NoArtifactsForGradeException(grade);
    }

    const totalWeight = gradePool.reduce((sum, item) => sum + (item.drawWeight || 1000), 0);
    const targetWeight = roll * totalWeight;

    let currentWeight = 0;
    for (const item of gradePool) {
      currentWeight += (item.drawWeight || 1000);
      if (targetWeight <= currentWeight) {
        return item;
      }
    }

    return gradePool[gradePool.length - 1];
  }

  /**
   * [Utils] 해시값(Blockhash + Index)을 시드로 사용하여 0~1 사이의 12자리 부동소수점 난수를 생성합니다.
   * (Deterministic Random Generation)
   */
  private generateRandomFromSeed(seed: string): number {
    const hash = createHash('sha256').update(seed).digest('hex');
    // 해시 문자열 앞 10자리를 16진수로 사용하여 충분한 정밀도 확보 (16^10 ≈ 1조)
    const hex = hash.substring(0, 10);
    const value = parseInt(hex, 16);
    const max = 0xffffffffff; // 16^10 - 1

    return value / max;
  }
}
