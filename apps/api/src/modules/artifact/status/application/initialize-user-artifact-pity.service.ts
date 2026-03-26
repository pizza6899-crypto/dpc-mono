import { Injectable } from '@nestjs/common';
import { ArtifactGrade } from '@prisma/client';
import { Transactional } from '@nestjs-cls/transactional';
import { UserArtifactPityRepositoryPort } from '../ports/user-artifact-pity.repository.port';
import { UserArtifactPity } from '../domain/user-artifact-pity.entity';

/**
 * [Artifact Status] 유저의 특정 등급 Pity 상태 초기화 서비스
 */
@Injectable()
export class InitializeUserArtifactPityService {
  constructor(
    private readonly pityRepo: UserArtifactPityRepositoryPort,
  ) { }

  /**
   * 특정 등급의 Pity 상태가 없으면 생성하여 반환합니다.
   */
  @Transactional()
  async execute(userId: bigint, grade: ArtifactGrade): Promise<UserArtifactPity> {
    const existingPity = await this.pityRepo.findByUserIdAndGrade(userId, grade);
    if (existingPity) {
      return existingPity;
    }

    const newPity = UserArtifactPity.create(userId, grade);
    return await this.pityRepo.upsert(newPity);
  }

  /**
   * 모든 유물 등급에 대해 Pity 상태를 초기화합니다. (시스템 가입 시 등)
   */
  @Transactional()
  async initializeAllGrades(userId: bigint): Promise<UserArtifactPity[]> {
    const grades = Object.values(ArtifactGrade);
    const results: UserArtifactPity[] = [];

    for (const grade of grades) {
      results.push(await this.execute(userId, grade));
    }

    return results;
  }
}
