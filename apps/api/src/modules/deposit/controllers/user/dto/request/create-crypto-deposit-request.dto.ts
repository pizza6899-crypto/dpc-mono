import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@prisma/client';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCryptoDepositRequestDto {

  @ApiPropertyOptional({
    description: '적용할 퀘스트 ID (프로모션 ID) / Applied quest ID (Promotion ID)',
    example: 'sqid-encoded-id',
  })
  @IsOptional()
  @IsString()
  appliedQuestId?: string;

  @ApiProperty({
    description: '입금할 암호화폐 심볼 / Currency symbol (Coin)',
    example: ExchangeCurrencyCode.USDT,
  })
  @IsNotEmpty()
  @IsString()
  payCurrency: string;

  @ApiProperty({
    description: '입금할 네트워크 / Network',
    example: 'ethereum',
  })
  @IsNotEmpty()
  @IsString()
  payNetwork: string;

  @ApiPropertyOptional({
    description: '입금 예정 금액 / Expected deposit amount',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  amount?: number;
}
