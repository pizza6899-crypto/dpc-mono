import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ApproveBankDepositDto {
  @ApiProperty({
    description: '실제 입금된 금액',
    example: 100000,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  actuallyPaid: number;

  @ApiPropertyOptional({
    description: '거래번호 (무통장 입금 거래번호)',
    example: '20240101001',
  })
  @IsOptional()
  @IsString()
  transactionHash?: string;

  @ApiPropertyOptional({
    description: '메모',
    example: '입금 확인 완료',
  })
  @IsOptional()
  @IsString()
  memo?: string;
}

