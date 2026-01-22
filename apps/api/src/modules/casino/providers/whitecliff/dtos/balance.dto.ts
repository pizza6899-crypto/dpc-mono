import { ApiProperty } from '@nestjs/swagger';
import { WhitecliffBaseRequestDto } from './base.dto';

export class GetWhitecliffBalanceRequestDto extends WhitecliffBaseRequestDto { }

export class GetWhitecliffBalanceResponseDto {
  @ApiProperty({
    description: `Status (상태)
    0 = error오류
    1 = success성공
    `,
    example: 1,
  })
  status: number;

  @ApiProperty({
    description:
      'Latest balance of the user (사용자의 최신 잔액), decimal(15,2)',
    example: 10000.0,
  })
  balance: number;

  @ApiProperty({
    description: `Error (에러 메시지)`,
    example: 'ACCESS_DENIED',
    required: false,
  })
  error?: string;
}
