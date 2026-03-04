import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@prisma/client';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateFiatDepositRequestDto {
  @ApiPropertyOptional({
    description: '입금 프로모션 코드 / Deposit promotion code',
    example: 'WELCOME_BONUS',
  })
  @IsOptional()
  @IsString()
  depositPromotionCode?: string;

  @ApiProperty({
    description: '입금할 통화 코드 / Currency code',
    example: ExchangeCurrencyCode.KRW,
  })
  @IsNotEmpty()
  @IsString()
  payCurrency: string;

  @ApiProperty({
    description: '입금 금액 / Deposit amount',
    example: 100000,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: '입금자명 / Depositor name',
    example: '김철수',
  })
  @IsNotEmpty()
  @IsString()
  depositorName: string;
}
