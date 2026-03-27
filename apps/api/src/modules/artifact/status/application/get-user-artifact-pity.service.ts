import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { UserArtifactPity } from '../domain/user-artifact-pity.entity';
import { UserArtifactPityRepositoryPort } from '../ports/user-artifact-pity.repository.port';
import { InitializeUserArtifactPityService } from './initialize-user-artifact-pity.service';

/**
 * [Artifact Status] 유저 등급별 Pity(천장) 스택 조회 서비스
 * - 시스템 가입 이후 등급별 뽑기 및 합성 성공 기록을 관리합니다.
 * - 데이터가 없는 경우 모든 등급(COMMON ~ MYTHIC 등)에 대해 초기화 작업을 수행합니다.
 */
@Injectable()
export class GetUserArtifactPityService {
  constructor(
    private readonly pityRepo: UserArtifactPityRepositoryPort,
    private readonly pityInitService: InitializeUserArtifactPityService,
  ) { }

  /**
   * 유저의 모든 등급별 Pity 정보 조회
   */
  @Transactional()
  async execute(userId: bigint): Promise<UserArtifactPity[]> {
    let pities = await this.pityRepo.findAllByUserId(userId);

    // 유물 등급별 Pity 정보가 아예 없는 경우(최초 조회 시) 전체 초기화 수행
    if (pities.length === 0) {
      pities = await this.pityInitService.initializeAllGrades(userId);
    }

    return pities;
  }
}
