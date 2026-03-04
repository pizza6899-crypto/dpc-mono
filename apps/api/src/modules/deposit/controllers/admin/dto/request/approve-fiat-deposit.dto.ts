import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ApproveFiatDepositDto {
  @ApiProperty({
    description: '실제 입금된 금액 / Actually paid amount',
    example: 100000,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  actuallyPaid: number;

  @ApiPropertyOptional({
    description: '거래 번호 / Transaction hash (TXID)',
    example: '20240101001',
  })
  @IsOptional()
  @IsString()
  transactionHash?: string;

  @ApiPropertyOptional({
    description: '관리자 상신용 메모 / Admin note (Memo)',
    example: '입금 확인 완료',
  })
  @IsOptional()
  @IsString()
  memo?: string;
}
