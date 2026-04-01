import { ApiProperty } from '@nestjs/swagger';

export class DrawRequestResponseDto {
  @ApiProperty({ description: 'Encoded Draw Request ID (adr_...) / Sqids로 인코딩된 뽑기 요청 ID' })
  requestId: string;

  @ApiProperty({ description: 'Target Solana Slot / 결과가 결정될 타겟 슬롯 번호' })
  targetSlot: string;

  @ApiProperty({ description: 'Creation Time / 생성 시각' })
  createdAt: Date;
}
