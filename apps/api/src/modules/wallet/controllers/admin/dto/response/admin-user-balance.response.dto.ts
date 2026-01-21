// src/modules/wallet/controllers/admin/dto/response/admin-user-balance.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode, WalletStatus } from '@prisma/client';

export class AdminUserBalanceItemDto {
  @ApiProperty({
    description: '통화',
    enum: ExchangeCurrencyCode,
    example: 'USD',
  })
  currency: ExchangeCurrencyCode;

  @ApiProperty({
    description: '메인 잔액',
    example: '1000.00',
    type: String,
  })
  mainBalance: string;

  @ApiProperty({
    description: '보너스 잔액',
    example: '500.00',
    type: String,
  })
  bonusBalance: string;

  @ApiProperty({
    description: '리워드 잔액',
    example: '100.00',
    type: String,
  })
  rewardBalance: string;

  @ApiProperty({
    description: '잠긴 잔액',
    example: '200.00',
    type: String,
  })
  lockedBalance: string;

  @ApiProperty({
    description: '금고 잔액',
    example: '1000.00',
    type: String,
  })
  vaultBalance: string;

  @ApiProperty({
    description: '총 가용 잔액 (메인 + 보너스 + 리워드)',
    example: '1600.00',
    type: String,
  })
  totalBalance: string;

  @ApiProperty({
    description: '지갑 상태',
    enum: WalletStatus,
    example: WalletStatus.ACTIVE,
  })
  status: WalletStatus;

  @ApiProperty({
    description: '마지막 업데이트 시간',
    example: '2024-01-01T00:00:00Z',
  })
  updatedAt: Date;
}

export class AdminUserBalanceResponseDto {
  @ApiProperty({
    description: '사용자 ID',
    example: '123',
    type: String,
  })
  userId: string;

  @ApiProperty({
    description: '사용자 잔액 정보',
    type: [AdminUserBalanceItemDto],
  })
  wallets: AdminUserBalanceItemDto[];
}

