// src/modules/deposit/dtos/deposit-address-user.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  DepositDetailStatus,
  DepositMethodType,
  ExchangeCurrencyCode,
} from '@prisma/client';

/**
 * 암호화폐 입금 주소 요청 DTO
 */
export class GetCryptoDepositAddressRequestDto {
  @ApiProperty({
    description: 'Currency symbol (예: BTC, ETH, USDT)',
    example: 'USDT',
  })
  @IsNotEmpty()
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Network name (예: TRC20, ERC20, Mainnet)',
    example: 'TRC20',
  })
  @IsNotEmpty()
  @IsString()
  network: string;

  @ApiPropertyOptional({
    description: 'Estimated deposit amount (예상 입금 금액)',
    example: '100',
  })
  @IsOptional()
  @IsNumberString()
  amount?: string;
}

/**
 * 암호화폐 입금 주소 응답 DTO
 */
export class CryptoDepositAddressResponseDto {
  @ApiProperty({ description: 'Currency symbol' })
  symbol: string;

  @ApiProperty({ description: 'Network name' })
  network: string;

  @ApiProperty({ description: 'Minimum deposit amount allowed' })
  minDepositAmount: string;

  @ApiProperty({ description: 'Deposit fee rate (0.01 = 1%)' })
  depositFeeRate: string;

  @ApiProperty({ description: 'Number of confirmations required' })
  confirmations: number;

  @ApiProperty({ description: 'Token contract address', nullable: true })
  contractAddress: string | null;

  @ApiPropertyOptional({
    description: 'Generated deposit address (Wallet Address)',
  })
  payAddress?: string;

  @ApiPropertyOptional({
    description: 'Extra ID for deposit (Tag, Memo, etc.)',
    nullable: true,
  })
  payAddressExtraId?: string | null;

  @ApiProperty({
    description: 'Unique identifier for this deposit request (Record UID)',
  })
  depositUid: string;
}

/**
 * 은행 입금 계좌 요청 DTO
 */
export class GetBankDepositAddressRequestDto {
  @ApiProperty({
    description: 'Currency code (예: KRW, THB)',
    example: 'KRW',
  })
  @IsNotEmpty()
  @IsString()
  currency: string;

  @ApiPropertyOptional({
    description: 'Estimated deposit amount (예상 입금 금액)',
    example: '50000',
  })
  @IsOptional()
  @IsNumberString()
  amount?: string;
}

/**
 * 은행 입금 계좌 응답 DTO
 */
export class BankDepositAddressResponseDto {
  @ApiProperty({ description: 'Bank name' })
  bankName: string;

  @ApiProperty({ description: 'Bank account number' })
  accountNumber: string;

  @ApiProperty({ description: 'Account holder name' })
  accountHolder: string;

  @ApiProperty({
    description: 'Instructions or description for the user',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Unique identifier for this deposit request (Record UID)',
  })
  depositUid: string;
}

/**
 * 사용자 입금 상세/목록 정보 DTO
 */
export class UserDepositResponseDto {
  @ApiProperty({ description: 'Deposit Record ID' })
  id: string;

  @ApiProperty({ enum: DepositDetailStatus, description: 'Deposit status' })
  status: DepositDetailStatus;

  @ApiProperty({ enum: DepositMethodType, description: 'Deposit method type' })
  methodType: DepositMethodType;

  @ApiPropertyOptional({ description: 'Payment provider', nullable: true })
  provider?: string | null;

  @ApiProperty({ enum: ExchangeCurrencyCode, description: 'Deposit currency' })
  depositCurrency: ExchangeCurrencyCode;

  @ApiProperty({ description: 'Network used (for crypto)', nullable: true })
  depositNetwork: string | null;

  @ApiProperty({ description: 'Requested amount' })
  requestedAmount: string;

  @ApiProperty({ description: 'Actually paid amount', nullable: true })
  actuallyPaid: string | null;

  @ApiProperty({ description: 'Deposit fee amount', nullable: true })
  feeAmount: string | null;

  @ApiProperty({
    description: 'Wallet address used (for crypto)',
    nullable: true,
  })
  walletAddress: string | null;


  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Confirmed at', nullable: true })
  confirmedAt: Date | null;

  @ApiProperty({ description: 'Failed at', nullable: true })
  failedAt: Date | null;

  @ApiProperty({ description: 'Failure reason if failed', nullable: true })
  failureReason: string | null;
}

/**
 * 입금 취소 응답 DTO
 */
export class CancelDepositResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;
}
