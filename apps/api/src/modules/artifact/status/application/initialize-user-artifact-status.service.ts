import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { UserArtifactStatusRepositoryPort } from '../ports/user-artifact-status.repository.port';
import { UserArtifactStatus } from '../domain/user-artifact-status.entity';

/**
 * [Artifact Status] 유저의 유물 시스템 상태 초기화 서비스
 * - 유입 시 최초 1회 기본 슬롯 및 통계 정보를 생성합니다.
 */
@Injectable()
export class InitializeUserArtifactStatusService {
  constructor(
    private readonly statusRepo: UserArtifactStatusRepositoryPort,
  ) { }

  /**
   * 유저의 초기 상태 생성 (이미 존재하면 기존 상태 반환)
   */
  @Transactional()
  async execute(userId: bigint): Promise<UserArtifactStatus> {
    const existingStatus = await this.statusRepo.findByUserId(userId);
    if (existingStatus) {
      return existingStatus;
    }

    const newStatus = UserArtifactStatus.create(userId);
    return await this.statusRepo.upsert(newStatus);
  }
}
