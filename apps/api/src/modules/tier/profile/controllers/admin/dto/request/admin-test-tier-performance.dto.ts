import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class AdminTestTierPerformanceRequestDto {
  @ApiProperty({
    description: 'Amount in USD to accumulate / 누적할 USD 금액',
    example: 1000,
  })
  @IsNumber()
  @IsPositive()
  amountUsd: number;
}
