import { ApiProperty } from '@nestjs/swagger';
import { ArtifactDrawStatus, ArtifactDrawType } from '@prisma/client';

/**
 * [Artifact Draw] 미확인 뽑기 내역 요약 DTO
 */
export class UnclaimedDrawResponseDto {
  @ApiProperty({ description: 'Encoded Draw Request ID (adr_...) / Sqids로 인코딩된 뽑기 요청 ID' })
  requestId: string;

  @ApiProperty({ enum: ArtifactDrawStatus, description: 'Current Status / 현재 상태 (PENDING, SETTLED)' })
  status: ArtifactDrawStatus;

  @ApiProperty({ enum: ArtifactDrawType, description: 'Draw Type / 뽑기 회수 타입 (SINGLE, TEN)' })
  drawType: ArtifactDrawType;

  @ApiProperty({ description: 'Target Slot / 결과 산출 대상 솔라나 슬롯', example: '254125800' })
  targetSlot: string;

  @ApiProperty({ description: 'Request Time / 신청 시각' })
  createdAt: Date;

  @ApiProperty({ description: 'Settlement Time (null if PENDING) / 결과 확정 시각', required: false })
  settledAt?: Date;
}
