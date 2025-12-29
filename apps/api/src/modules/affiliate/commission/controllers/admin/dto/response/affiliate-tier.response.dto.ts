// src/modules/affiliate/commission/controllers/admin/dto/response/affiliate-tier.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { AffiliateTierLevel } from '@repo/database';

export class AffiliateTierResponseDto {
  @ApiProperty({
    description: '티어 UID',
    example: 'tier-1234567890',
  })
  uid: string;

  @ApiProperty({
    description: '어필리에이트 ID',
    example: '123',
  })
  affiliateId: bigint;

  @ApiProperty({
    description: '티어',
    enum: AffiliateTierLevel,
    example: AffiliateTierLevel.BRONZE,
  })
  tier: AffiliateTierLevel;

  @ApiProperty({
    description: '기본 요율',
    example: '0.005',
    type: String,
  })
  baseRate: string;

  @ApiProperty({
    description: '수동 설정 요율',
    example: '0.01',
    type: String,
    nullable: true,
  })
  customRate: string | null;

  @ApiProperty({
    description: '수동 요율 사용 여부',
    example: false,
  })
  isCustomRate: boolean;

  @ApiProperty({
    description: '월간 총 베팅 금액',
    example: '100000.00',
    type: String,
  })
  monthlyWagerAmount: string;

  @ApiProperty({
    description: '수동 요율 설정자 ID',
    example: '456',
    nullable: true,
  })
  customRateSetBy: bigint | null;

  @ApiProperty({
    description: '수동 요율 설정일시',
    example: '2024-01-02T00:00:00Z',
    nullable: true,
  })
  customRateSetAt: Date | null;

  @ApiProperty({
    description: '생성일시',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일시',
    example: '2024-01-01T00:00:00Z',
  })
  updatedAt: Date;
}
