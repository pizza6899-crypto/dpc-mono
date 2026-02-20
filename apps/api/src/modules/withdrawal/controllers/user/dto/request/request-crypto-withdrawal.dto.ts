import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RequestCryptoWithdrawalDto {
  @ApiProperty({
    description: 'Withdrawal amount / 출금 금액',
    example: '100.5',
  })
  @IsString()
  @IsNotEmpty()
  amount!: string;

  @ApiProperty({
    description: 'Cryptocurrency symbol / 암호화폐 심볼',
    example: 'USDT',
  })
  @IsString()
  @IsNotEmpty()
  symbol!: string;

  @ApiProperty({
    description: 'Network / 네트워크',
    example: 'TRC20',
  })
  @IsString()
  @IsNotEmpty()
  network!: string;

  @ApiProperty({
    description: 'Wallet address / 지갑 주소',
    example: 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  })
  @IsString()
  @IsNotEmpty()
  walletAddress!: string;

  @ApiPropertyOptional({
    description: 'Wallet address extra ID (memo, tag) / 추가 ID',
    example: '12345',
  })
  @IsString()
  @IsOptional()
  walletAddressExtraId?: string;
}
