// src/modules/affiliate/commission/controllers/admin/dto/response/commission.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  CommissionStatus,
  ExchangeCurrencyCode,
  GameCategory,
} from '@repo/database';

export class CommissionAdminResponseDto {
  @ApiProperty({
    description: '커미션 ID',
    example: '123',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: '어필리에이트 ID',
    example: '123',
  })
  affiliateId: bigint;

  @ApiProperty({
    description: '피추천인 사용자 ID',
    example: '456',
  })
  subUserId: bigint;

  @ApiProperty({
    description: '게임 라운드 ID',
    example: '123',
    type: String,
  })
  gameRoundId: string | null;

  @ApiProperty({
    description: '베팅 금액',
    example: '10000.00',
    type: String,
  })
  wagerAmount: string;

  @ApiProperty({
    description: '승리 금액',
    example: '5000.00',
    type: String,
    nullable: true,
  })
  winAmount: string | null;

  @ApiProperty({
    description: '커미션 금액',
    example: '100.00',
    type: String,
  })
  commission: string;

  @ApiProperty({
    description: '적용된 요율',
    example: '0.01',
    type: String,
  })
  rateApplied: string;

  @ApiProperty({
    description: '통화',
    enum: ExchangeCurrencyCode,
    example: ExchangeCurrencyCode.USD,
  })
  currency: ExchangeCurrencyCode;

  @ApiProperty({
    description: '커미션 상태',
    enum: CommissionStatus,
    example: CommissionStatus.PENDING,
  })
  status: CommissionStatus;

  @ApiProperty({
    description: '게임 카테고리',
    enum: GameCategory,
    example: GameCategory.SLOTS,
    nullable: true,
  })
  gameCategory: GameCategory | null;

  @ApiProperty({
    description: '정산일',
    example: '2024-01-15T00:00:00Z',
    nullable: true,
  })
  settlementDate: Date | null;

  @ApiProperty({
    description: '출금 요청일',
    example: '2024-01-20T00:00:00Z',
    nullable: true,
  })
  claimedAt: Date | null;

  @ApiProperty({
    description: '출금 완료일',
    example: '2024-01-21T00:00:00Z',
    nullable: true,
  })
  withdrawnAt: Date | null;

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
