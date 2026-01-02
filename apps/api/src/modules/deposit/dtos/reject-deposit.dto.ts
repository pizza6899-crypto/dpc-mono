import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

// src/modules/deposit/dtos/reject-deposit.dto.ts
export class RejectDepositDto {
  @ApiProperty({
    description: '거부 사유 / Rejection reason',
    example: '입금 정보 불일치',
  })
  @IsNotEmpty()
  @IsString()
  failureReason: string; // 거부 사유
}

