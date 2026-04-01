import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ArtifactGrade } from '@prisma/client';
import { ArtifactCatalog } from '../../master/domain/artifact-catalog.entity';
import { NoArtifactsForGradeException } from '../../master/domain/master.exception';

export interface SynthesisRollResult {
  isSuccess: boolean;
  targetGrade: ArtifactGrade;
  remappedRoll: number;
  isGuaranteed: boolean;
}

/**
 * [Artifact Synthesis] 유물 합성 결과 결정을 위한 도메인 정책
 */
@Injectable()
export class ArtifactSynthesisPolicy {
  /**
   * [Rule] 합성을 수행하고 성공 여부 및 아이템 선택용 난수를 반환합니다.
   * 
   * @param currentGrade 재료 유물들의 등급
   * @param successRate 해당 등급의 기본 합성 성공 확률 (0 ~ 1.0)
   * @param failCount 현재 유저의 해당 등급 누적 실패 횟수
   * @param guaranteedCount 정책상 확정 성공 기준 횟수 (없으면 undefined)
   * @param seed 솔라나 블록해시 등 무작위 시드
   */
  rollSynthesis(
    currentGrade: ArtifactGrade,
    successRate: number,
    failCount: number,
    guaranteedCount: number | undefined,
    seed: string,
  ): SynthesisRollResult {
    const rawRoll = this.generateRandomFromSeed(seed);
    const nextGrade = this.getNextGrade(currentGrade);
    
    // 1. 천장(Pity) 체크: 누적 실패 횟수 기준으로 보장 횟수 만족 시 확정 성공
    // (연속 실패가 아닌 '누적 실패' 기준이므로 modulo 연산을 사용. 성공 시에도 초기화되지 않음)
    // 예: 보장 횟수가 5번이라면, 누적 실패가 4, 9, 14, 19... 번일 때 다음 시도는 무조건 성공
    if (guaranteedCount && (failCount % guaranteedCount) === (guaranteedCount - 1)) {
      return {
        isSuccess: true,
        targetGrade: nextGrade,
        remappedRoll: rawRoll, // 이미 성공이므로 기본 난수 그대로 아이템 선택에 사용
        isGuaranteed: true,
      };
    }

    // 2. 일반 확률 체크
    if (rawRoll <= successRate) {
      // 합성 성공 (등급 업)
      const remapped = successRate > 0 ? rawRoll / successRate : 0;
      return {
        isSuccess: true,
        targetGrade: nextGrade,
        remappedRoll: Math.min(Math.max(remapped, 0), 1),
        isGuaranteed: false,
      };
    } else {
      // 합성 실패 (동일 등급 유지)
      const failRate = 1 - successRate;
      const remapped = failRate > 0 ? (rawRoll - successRate) / failRate : 0;
      return {
        isSuccess: false,
        targetGrade: currentGrade,
        remappedRoll: Math.min(Math.max(remapped, 0), 1),
        isGuaranteed: false,
      };
    }
  }

  /**
   * [Rule] 결과 등급의 풀에서 특정 유물을 무작위로 선택합니다. (DrawPolicy와 동일 로직)
   * 
   * @param roll 0~1 사이의 재생산된 난수 (remappedRoll)
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
   * [Utils] 해시값을 시드로 사용하여 0~1 사이의 정밀한 부동소수점 난수를 생성합니다.
   */
  private generateRandomFromSeed(seed: string): number {
    const hash = createHash('sha256').update(seed).digest('hex');
    const hex = hash.substring(0, 10);
    const value = parseInt(hex, 16);
    const max = 0xffffffffff; // 16^10 - 1

    return value / max;
  }

  /**
   * [Utils] 다음 유물 등급을 가져옵니다.
   */
  private getNextGrade(currentGrade: ArtifactGrade): ArtifactGrade {
    const grades = Object.values(ArtifactGrade);
    const currentIndex = grades.indexOf(currentGrade);
    
    // 만약 최고 등급인 경우 동일 등급 유지 (정책상 최고 등급은 합성이 불가하도록 상위 레이어에서 막아야 함)
    if (currentIndex >= grades.length - 1) {
      return currentGrade;
    }
    
    return grades[currentIndex + 1];
  }
}
