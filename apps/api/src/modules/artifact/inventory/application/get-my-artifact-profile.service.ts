import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { GetUserArtifactStatusService } from '../../status/application/get-user-artifact-status.service';
import { UserArtifactRepositoryPort } from '../ports/user-artifact.repository.port';
import { SqidsService } from 'src/infrastructure/sqids/sqids.service';
import { SqidsPrefix } from 'src/infrastructure/sqids/sqids.constants';
import { UserArtifactProfileResponseDto, UserArtifactSlotResponseDto, UserArtifactEffectSummaryDto } from '../controllers/user/dto/response/user-artifact-profile.response.dto';

/**
 * [Artifact Inventory] 유저 유물 시스템 통합 프로필 조회 서비스
 * - 활성 슬롯 수, 보유 티켓 정보, 장착된 유물 요약, 효과 총합 등을 한 번에 반환합니다.
 */
@Injectable()
export class GetMyArtifactProfileService {
  constructor(
    private readonly statusService: GetUserArtifactStatusService,
    private readonly repository: UserArtifactRepositoryPort,
    private readonly sqidsService: SqidsService,
  ) { }

  /**
   * 유저의 전체 유물 프로필 정보 통합 로직
   */
  @Transactional()
  async execute(userId: bigint): Promise<UserArtifactProfileResponseDto> {
    // 1. 기본 상태 정보 (슬롯 수, 티켓 수) 조회
    const status = await this.statusService.execute(userId);

    // 2. 전체 보유 유물 목록 조회 (장착 상태 포함)
    const allArtifacts = await this.repository.findByUserId(userId);

    // 3. 응답 구조 초기화
    // (1) 슬롯 정보: 활성화된 개수만큼 빈 슬롯 미리 채우기
    const slots: UserArtifactSlotResponseDto[] = Array.from({ length: status.activeSlotCount }, (_, i) => ({
      slotNo: i + 1,
      isEquipped: false,
      id: null,
      artifactCode: null,
      grade: null,
      acquiredAt: null,
    }));

    // (2) 효과 요약 총합 초기화
    const effects: UserArtifactEffectSummaryDto = {
      casinoBenefit: 0,
      slotBenefit: 0,
      sportsBenefit: 0,
      minigameBenefit: 0,
      badBeatBenefit: 0,
      criticalBenefit: 0,
    };

    // 4. 장착 중인 유물을 찾아 슬롯에 매핑하고 효과를 합산
    const equippedArtifacts = allArtifacts.filter(a => a.isEquipped);

    for (const artifact of equippedArtifacts) {
      const stats = artifact.catalog?.statsSummary;

      // 효과 합계 계산
      if (stats) {
        effects.casinoBenefit += stats.casinoBenefit;
        effects.slotBenefit += stats.slotBenefit;
        effects.sportsBenefit += stats.sportsBenefit;
        effects.minigameBenefit += stats.minigameBenefit;
        effects.badBeatBenefit += stats.badBeatBenefit;
        effects.criticalBenefit += stats.criticalBenefit;
      }

      // 슬롯 장착 정보 매핑 (슬롯 번호 범위 체크)
      if (artifact.slotNo && artifact.slotNo <= status.activeSlotCount) {
        const slotIdx = artifact.slotNo - 1;
        slots[slotIdx] = {
          slotNo: artifact.slotNo,
          isEquipped: true,
          id: this.sqidsService.encode(artifact.id, SqidsPrefix.USER_ARTIFACT),
          artifactCode: artifact.catalog?.code || 'UNKNOWN',
          grade: artifact.catalog?.grade ?? null,
          acquiredAt: artifact.createdAt,
        };
      }
    }

    return {
      activeSlotCount: status.activeSlotCount,
      slots,
      effects,
      tickets: status.tickets,
    };
  }
}
