import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { UserArtifactStatusRepositoryPort } from '../ports/user-artifact-status.repository.port';
import { UserArtifactStatus } from '../domain/user-artifact-status.entity';

/**
 * [Artifact Status] 유저의 유물 시스템 상태 조회 서비스 (최적화 버전)
 * - 저장된 상태 정보를 단순히 조회(Read)하기만 합니다.
 * - 데이터가 아예 없는 경우에만 최초 기본 레코드를 생성합니다.
 */
@Injectable()
export class GetUserArtifactStatusService {
  constructor(
    private readonly statusRepo: UserArtifactStatusRepositoryPort,
  ) { }

  /**
   * 유저의 현재 유물 시스템 상태 반환
   */
  @Transactional()
  async execute(userId: bigint): Promise<UserArtifactStatus> {
    const status = await this.statusRepo.findByUserId(userId);

    // 데이터가 있는 경우 즉시 반환 (부하 최소화)
    if (status) {
      return status;
    }

    // 최초 1회만 생성하여 기본 슬롯 정보를 확보
    return await this.statusRepo.upsert(UserArtifactStatus.create(userId));
  }
}
