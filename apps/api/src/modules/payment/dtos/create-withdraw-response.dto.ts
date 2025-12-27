// src/modules/payment/dtos/create-withdraw-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class CreateWithdrawResponseDto {
  @ApiProperty({
    description: '출금 금액',
    example: 100,
  })
  amount: number;

  @ApiProperty({
    description: '출금 통화',
    example: 'trx',
  })
  currency: string;

  @ApiProperty({
    description: '출금 주소',
    example: 'TJ8yt3x9AowmQ8WygeYKwUT9TajRE4iCPx',
  })
  address: string;
}
