import { Injectable } from '@nestjs/common';
import { ArtifactGrade } from '@prisma/client';
import { ArtifactCatalogRepositoryPort } from '../ports/artifact-catalog.repository.port';
import { ArtifactDrawConfigRepositoryPort } from '../ports/artifact-draw-config.repository.port';
import { ArtifactCatalog } from '../domain/artifact-catalog.entity';
import { ArtifactDrawConfig } from '../domain/artifact-draw-config.entity';
import { NoArtifactsForGradeException } from '../domain/master.exception';

/**
 * [Artifact] 유물 가중치 랜덤 뽑기 서비스
 */
@Injectable()
export class PickRandomArtifactService {
  constructor(
    private readonly catalogRepo: ArtifactCatalogRepositoryPort,
    private readonly drawConfigRepo: ArtifactDrawConfigRepositoryPort,
  ) { }

  /**
   * 유물 1개 랜덤 추첨
   */
  async execute(): Promise<ArtifactCatalog> {
    const [drawConfigs, candidates] = await Promise.all([
      this.drawConfigRepo.findAll(),
      this.catalogRepo.findAll(),
    ]);

    return this.pickInternal(drawConfigs, candidates);
  }

  /**
   * 유물 다건 랜덤 추첨 (e.g. 10연속 뽑기)
   * 데이터를 단 1회만 조회하여 대량 추첨 성능을 최적화함
   */
  async executeMany(count: number): Promise<ArtifactCatalog[]> {
    if (count <= 0) return [];

    const [drawConfigs, candidates] = await Promise.all([
      this.drawConfigRepo.findAll(),
      this.catalogRepo.findAll(),
    ]);

    const results: ArtifactCatalog[] = [];
    for (let i = 0; i < count; i++) {
      results.push(this.pickInternal(drawConfigs, candidates));
    }
    return results;
  }

  /**
   * 확률 및 가중치를 기반으로 최종 유물 1종 결정
   */
  private pickInternal(
    drawConfigs: ArtifactDrawConfig[],
    candidates: ArtifactCatalog[],
  ): ArtifactCatalog {
    // 1. 등급(Grade) 추첨
    const selectedGrade = this.pickGrade(drawConfigs);

    // 2. 등급 내 유물(Artifact) 추첨
    const gradeCandidates = candidates.filter((a) => a.grade === selectedGrade);

    if (gradeCandidates.length === 0) {
      throw new NoArtifactsForGradeException(selectedGrade);
    }

    return this.pickArtifact(gradeCandidates);
  }

  /**
   * 등급별 확률(Prisma.Decimal) 기반 가중치 랜덤 선택
   */
  private pickGrade(configs: ArtifactDrawConfig[]): ArtifactGrade {
    const totalProbability = configs.reduce(
      (sum, config) => sum + config.probability.toNumber(),
      0,
    );
    let random = Math.random() * totalProbability;

    for (const config of configs) {
      random -= config.probability.toNumber();
      if (random <= 0) {
        return config.grade;
      }
    }

    // 예외 방지용 (마지막 등급 반환)
    return configs[configs.length - 1].grade;
  }

  /**
   * 유물별 가중치(drawWeight: number) 기반 가중치 랜덤 선택
   */
  private pickArtifact(artifacts: ArtifactCatalog[]): ArtifactCatalog {
    const totalWeight = artifacts.reduce((sum, a) => sum + a.drawWeight, 0);
    let random = Math.random() * totalWeight;

    for (const artifact of artifacts) {
      random -= artifact.drawWeight;
      if (random <= 0) {
        return artifact;
      }
    }

    return artifacts[artifacts.length - 1];
  }
}
