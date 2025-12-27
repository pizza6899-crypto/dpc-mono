// src/modules/comp/dtos/comp-balance.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class ClaimCompRequestDto {
  @ApiProperty({
    description:
      'Date to claim comp (Tokyo time, YYYY-MM-DD format) / 콤프를 수령할 날짜 도쿄시 기준 (YYYY-MM-DD 형식)',
    example: '2024-01-15',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
}

export class UnclaimedCompResponseDto {
  @ApiProperty({
    description: 'Earning date / 적립 날짜',
    example: '2025-10-15',
  })
  earningDate: string;

  @ApiProperty({
    description: 'Comp amount earned / 적립된 콤프 금액',
    example: 10.05,
  })
  compEarned: number;
}
