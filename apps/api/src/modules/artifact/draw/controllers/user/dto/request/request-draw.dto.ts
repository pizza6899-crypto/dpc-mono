import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ArtifactDrawType, ArtifactDrawPaymentType, ArtifactGrade, ExchangeCurrencyCode } from '@prisma/client';

export class RequestDrawDto {
  @ApiProperty({ enum: ArtifactDrawType, description: 'Draw Type / 뽑기 타입 (SINGLE: 1회, TEN: 10+1회)' })
  @IsEnum(ArtifactDrawType)
  drawType: ArtifactDrawType;

  @ApiProperty({ enum: ArtifactDrawPaymentType, description: 'Payment Method / 결제 수단 (TICKET, CURRENCY)' })
  @IsEnum(ArtifactDrawPaymentType)
  paymentType: ArtifactDrawPaymentType;

  @ApiProperty({
    enum: ArtifactGrade,
    required: false,
    default: 'ALL',
    description: 'Ticket Grade / 확정권 사용 시 티켓 등급 (ALL or Specific Grade)',
  })
  @IsOptional()
  ticketType?: ArtifactGrade | 'ALL' = 'ALL';

  @ApiProperty({
    enum: ExchangeCurrencyCode,
    required: false,
    description: 'Currency Code / 재화 결제 시 통화 코드',
  })
  @IsOptional()
  @IsEnum(ExchangeCurrencyCode)
  currencyCode?: ExchangeCurrencyCode;
}
