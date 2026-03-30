import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ArtifactDrawConfigRepositoryPort } from '../ports/artifact-draw-config.repository.port';
import { UpdateDrawConfigsAdminRequestDto } from '../controllers/admin/dto/request/update-draw-configs-admin.request.dto';
import { ArtifactDrawConfig } from '../domain/artifact-draw-config.entity';
import {
  ArtifactDrawConfigNotFoundException,
} from '../domain/master.exception';
import { ArtifactDrawConfigPolicy } from '../domain/artifact-draw-config.policy';
import { AdvisoryLockService } from 'src/infrastructure/concurrency/advisory-lock.service';
import { LockNamespace } from 'src/infrastructure/concurrency/concurrency.constants';

/**
 * [Artifact] 유물 뽑기 확률 설정 일괄 수정 서비스 (어드민용)
 */
@Injectable()
export class UpdateDrawConfigsAdminService {
  constructor(
    private readonly drawConfigRepo: ArtifactDrawConfigRepositoryPort,
    private readonly drawPolicy: ArtifactDrawConfigPolicy,
    private readonly advisoryLockService: AdvisoryLockService,
  ) { }

  /**
   * 등급별 확률 설정을 일괄 업데이트함
   * - 트랜잭션을 적용하여 전체 업데이트 원자성 보장
   * - Advisory Lock을 사용하여 동시성 제어 (동일 작업 중복 방지)
   * - 도메인 정책을 사용하여 정합성(총합 1.0 등)을 검증함
   * - 업데이트 후 캐시 자동 무효화 (Repository 레이어 수행)
   */
  @Transactional()
  async execute(dto: UpdateDrawConfigsAdminRequestDto): Promise<ArtifactDrawConfig[]> {
    // 0. 동시성 제어: 전역 유물 설정 락 획득 (트랜잭션 종료 시 자동 해제)
    await this.advisoryLockService.acquireLock(LockNamespace.ARTIFACT_MASTER, 'DRAW_CONFIG');

    const existingConfigs = await this.drawConfigRepo.findAll();

    // 빠른 조회를 위해 Map 구성
    const configMap = new Map<string, ArtifactDrawConfig>();
    existingConfigs.forEach((c) => configMap.set(c.grade, c));

    const updatedConfigs: ArtifactDrawConfig[] = [];

    // 1. 엔티티 상태 변경
    for (const itemDto of dto.configs) {
      const config = configMap.get(itemDto.grade);
      if (!config) {
        throw new ArtifactDrawConfigNotFoundException(itemDto.grade);
      }

      config.updateProbability(itemDto.probability);
    }

    // 2. 도메인 정책 검증 (정책/서비스 전임)
    // 맵 내의 전체 등급 리스트를 전달하여 정합성 검토
    const allConfigs = Array.from(configMap.values());
    this.drawPolicy.validateDrawConfigs(allConfigs, existingConfigs.length);

    // 3. DB 일괄 업데이트 수행
    await this.drawConfigRepo.updateMany(allConfigs);

    return allConfigs;
  }
}
