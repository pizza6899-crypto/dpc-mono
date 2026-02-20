import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@prisma/client';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCryptoDepositRequestDto {
  @ApiPropertyOptional({
    description: 'Deposit promotion code (입금 프로모션 코드)',
    example: 'WELCOME_BONUS',
  })
  @IsOptional()
  @IsString()
  depositPromotionCode?: string;

  @ApiProperty({
    description: 'Currency symbol (입금할 암호화폐 심볼)',
    example: ExchangeCurrencyCode.USDT,
  })
  @IsNotEmpty()
  @IsString()
  payCurrency: string;

  @ApiProperty({
    description: 'Network (입금할 네트워크)',
    example: 'ethereum',
  })
  @IsNotEmpty()
  @IsString()
  payNetwork: string;

  @ApiPropertyOptional({
    description: 'Expected deposit amount (입금 예정 금액)',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  amount?: number;
}
