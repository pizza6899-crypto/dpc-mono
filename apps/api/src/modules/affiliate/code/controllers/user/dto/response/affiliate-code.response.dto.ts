// src/modules/affiliate/code/controllers/user/dto/response/affiliate-code.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class AffiliateCodeResponseDto {
  @ApiProperty({
    description: 'Code ID / 코드 ID',
    example: 'clx1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'User ID / 사용자 ID',
    example: 'user-123',
  })
  userId: bigint;

  @ApiProperty({
    description: 'Affiliate code / 어플리에이트 코드',
    example: 'SUMMER2024',
  })
  code: string;

  @ApiProperty({
    description: 'Campaign name / 캠페인 이름',
    example: 'Summer Campaign',
    nullable: true,
  })
  campaignName: string | null;

  @ApiProperty({
    description: 'Is active / 활성화 여부',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Is default / 기본 코드 여부',
    example: false,
  })
  isDefault: boolean;

  @ApiProperty({
    description: 'Expires at / 만료일시',
    example: '2024-12-31T23:59:59.000Z',
    nullable: true,
  })
  expiresAt: Date | null;

  @ApiProperty({
    description: 'Created at / 생성일시',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated at / 수정일시',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Last used at / 마지막 사용일시',
    example: '2024-01-15T10:30:00.000Z',
    nullable: true,
  })
  lastUsedAt: Date | null;
}

