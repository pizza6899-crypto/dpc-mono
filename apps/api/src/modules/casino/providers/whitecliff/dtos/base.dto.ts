import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 모든 요청의 기본이 되는 DTO
 * 필수 공통 필드: user_id
 */
export class WhitecliffBaseRequestDto {
  @ApiProperty({
    description: 'User ID of WHITECLIFF (화이트클리프 사용자 ID)',
    example: 1000011,
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  user_id: number;

  @ApiPropertyOptional({
    description: `Product's ID (상품 ID) - Optional`,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  prd_id?: number;

  @ApiPropertyOptional({
    description: 'Session ID (세션 ID)',
    example: '49ccfa959657fca7e0abc7774d0f3a7d',
  })
  @IsOptional()
  @IsString()
  sid?: string;
}

/**
 * 트랜잭션(베팅, 지급 등) 공통 DTO
 */
export class WhitecliffTransactionBaseDto extends WhitecliffBaseRequestDto {
  @ApiProperty({
    description: 'Transaction ID (트랜잭션 ID)',
    example: 'txn123456789',
  })
  @IsString()
  @IsNotEmpty()
  txn_id: string;

  @ApiProperty({
    description: 'Amount (금액)',
    example: 100.0,
  })
  @IsNumber()
  @Type(() => Number)
  amount: number;
}
