import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

// src/modules/deposit/dtos/reject-deposit.dto.ts
export class RejectDepositRequestDto {
  @ApiProperty({
    description: '거부 사유(메모) / Rejection reason (Memo)',
    example: '입금 정보 불일치',
  })
  @IsNotEmpty()
  @IsString()
  memo: string; // 거부 사유 (메모로 통합)
}
