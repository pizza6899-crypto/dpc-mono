import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ApproveWithdrawalDto {
  @ApiPropertyOptional({
    description: 'Admin note / 관리자 메모',
    example: 'Verified by admin',
  })
  @IsString()
  @IsOptional()
  note?: string;
}

export class RejectWithdrawalDto {
  @ApiProperty({
    description: 'Rejection reason / 거부 사유',
    example: 'Suspicious activity detected',
  })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
