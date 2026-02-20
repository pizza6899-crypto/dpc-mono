import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ExchangeCurrencyCode } from '@prisma/client';

export class GetWageringSummaryQueryDto {
  @ApiPropertyOptional({
    description:
      'Currency Filter (통화 필터). 지정하지 않으면 첫 번째 활성 롤링의 통화를 기준으로 요약합니다.',
    enum: ExchangeCurrencyCode,
  })
  @IsOptional()
  @IsEnum(ExchangeCurrencyCode)
  currency?: ExchangeCurrencyCode;
}
