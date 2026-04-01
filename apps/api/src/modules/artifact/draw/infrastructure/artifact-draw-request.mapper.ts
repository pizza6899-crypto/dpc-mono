import { Injectable } from '@nestjs/common';
import { ArtifactDrawRequest } from '../domain/artifact-draw-request.entity';
import { ArtifactDrawRequest as ArtifactDrawRequestModel } from '@prisma/client';

/**
 * [Artifact Draw] 유물 뽑기 요청 매퍼
 */
@Injectable()
export class ArtifactDrawRequestMapper {
  /**
   * DB 레코드를 엔티티로 변환
   */
  toEntity(record: ArtifactDrawRequestModel): ArtifactDrawRequest {
    return ArtifactDrawRequest.rehydrate({
      id: record.id,
      userId: record.userId,
      targetSlot: record.targetSlot,
      drawType: record.drawType,
      paymentType: record.paymentType,
      ticketType: record.ticketType,
      currencyCode: record.currencyCode,
      status: record.status,
      result: record.result,
      settledAt: record.settledAt,
      claimedAt: record.claimedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  /**
   * 엔티티를 DB에 저장 가능한 데이터 객체로 변환
   */
  toPersistence(entity: ArtifactDrawRequest) {
    return {
      userId: entity.userId,
      targetSlot: entity.targetSlot,
      drawType: entity.drawType,
      paymentType: entity.paymentType,
      ticketType: entity.ticketType,
      currencyCode: entity.currencyCode,
      status: entity.status,
      // Map domain field names back to whatever DB structure is intended (usually same as domain)
      result: entity.result as any,
      settledAt: entity.settledAt,
      claimedAt: entity.claimedAt,
      updatedAt: entity.updatedAt,
    };
  }
}
