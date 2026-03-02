import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class AdminUpdateCompConfigDto {
  @ApiProperty({
    enum: ExchangeCurrencyCode,
    description: 'Currency code / 통화 코드',
  })
  @IsEnum(ExchangeCurrencyCode)
  currency: ExchangeCurrencyCode;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Enable/disable comp earning / 콤프 적립 활성화 여부',
  })
  @IsOptional()
  @IsBoolean()
  isEarnEnabled?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Enable/disable comp settlement / 콤프 정산 활성화 여부',
  })
  @IsOptional()
  @IsBoolean()
  isSettlementEnabled?: boolean;

  @ApiPropertyOptional({
    type: Number,
    description:
      'Minimum amount required for daily settlement / 일일 정산을 위한 최소 콤프 금액',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minSettlementAmount?: number;

  @ApiPropertyOptional({
    type: Number,
    description:
      'Maximum comp earned per user per day / 유저당 일일 최대 콤프 적립 한도',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxDailyEarnPerUser?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Config description or memo / 설정 설명 또는 메모',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
