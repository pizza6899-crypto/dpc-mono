import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { ArtifactDrawStatus } from '@prisma/client';
import type { PrismaTransaction } from '../../../../infrastructure/prisma/prisma.module';
import { ArtifactDrawRequest } from '../domain/artifact-draw-request.entity';
import { ArtifactDrawRequestRepositoryPort } from '../ports/artifact-draw-request.repository.port';
import { ArtifactDrawRequestMapper } from './artifact-draw-request.mapper';

/**
 * [Artifact Draw] Prisma 기반 유물 뽑기 요청 리포지토리
 */
@Injectable()
export class PrismaArtifactDrawRequestRepository implements ArtifactDrawRequestRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: ArtifactDrawRequestMapper,
  ) { }

  /**
   * 고유 ID로 뽑기 요청 조회
   */
  async findById(id: bigint): Promise<ArtifactDrawRequest | null> {
    const record = await this.tx.artifactDrawRequest.findUnique({
      where: { id },
    });
    return record ? this.mapper.toEntity(record) : null;
  }

  /**
   * 유저별 결과 산출 완료 및 미지급(Settled) 내역 조회
   */
  async findSettledByUserId(userId: bigint): Promise<ArtifactDrawRequest[]> {
    const records = await this.tx.artifactDrawRequest.findMany({
      where: {
        userId,
        status: ArtifactDrawStatus.SETTLED,
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.mapper.toEntity(r));
  }

  /**
   * 뽑기 요청 저장 (Upsert)
   */
  async save(request: ArtifactDrawRequest): Promise<ArtifactDrawRequest> {
    const data = this.mapper.toPersistence(request);

    let record;
    if (request.id === 0n) {
      // 신규 생성
      record = await this.tx.artifactDrawRequest.create({
        data: {
          ...data,
          createdAt: request.createdAt,
        },
      });
    } else {
      // 기존 데이터 업데이트
      record = await this.tx.artifactDrawRequest.update({
        where: { id: request.id },
        data,
      });
    }

    return this.mapper.toEntity(record);
  }
}
