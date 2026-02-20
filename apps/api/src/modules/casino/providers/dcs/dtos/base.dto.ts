import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsNotEmpty, Length } from 'class-validator';

// ==========================================
// Base Request DTOs
// ==========================================

/**
 * 모든 요청의 기본이 되는 DTO
 * 포함 필드: brand_id, sign, brand_uid, currency
 */
export class DcsBaseRequestDto {
  @ApiProperty({
    description: 'Brand ID',
    example: 'brand123',
  })
  @IsString()
  @IsNotEmpty()
  brand_id: string;

  @ApiProperty({
    description: 'Sign (MD5 hash)',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  })
  @IsString()
  @IsNotEmpty()
  @Length(32, 32)
  sign: string;

  @ApiProperty({
    description:
      'Unique User ID from operator (only English characters and numbers, case insensitive)',
    example: 'user123ABC',
  })
  @IsString()
  @IsNotEmpty()
  brand_uid: string;

  @ApiProperty({
    description: 'Player currency code',
    example: 'USD',
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 4)
  currency: string;
}

/**
 * 베팅/트랜잭션 관련 공통 DTO
 * 포함 필드: round_id, wager_id, provider, transaction_time, is_endround
 */
export class DcsTransactionBaseDto extends DcsBaseRequestDto {
  @ApiProperty({
    description: 'Unique bet round identifier',
    example: 'round123456789',
    maxLength: 64,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  round_id: string;

  @ApiProperty({
    description: 'Unique transaction identifier within a bet round',
    example: 'wager123456789',
    maxLength: 64,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  wager_id: string;

  @ApiProperty({
    description: 'Game provider code',
    example: 'PROVIDER01',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({
    description: 'Transaction time (format: yyyy-MM-ddTHH:mm:ssZ)',
    example: '2024-01-01T00:00:00Z',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  transaction_time: string;

  @ApiProperty({
    description: 'Round finish status (false=Unfinished, true=Round Finish)',
    example: false,
    type: Boolean,
  })
  @IsBoolean()
  is_endround: boolean;
}

// ==========================================
// Base Response DTOs
// ==========================================

export class DcsResponseDataDto {
  @ApiProperty({
    description: 'Unique User ID from operator',
    example: 'user123ABC',
    maxLength: 20,
  })
  brand_uid: string;

  @ApiProperty({
    description: 'Player currency code',
    example: 'USD',
    maxLength: 4,
  })
  currency: string;

  @ApiProperty({
    description: 'Player current balance',
    example: 1000.0,
    type: Number,
  })
  balance: number;
}

export class DcsCommonResponseDto {
  @ApiProperty({
    description: 'DCS API Response Code',
    example: 1,
    type: Number,
  })
  code: number;

  @ApiProperty({
    description: 'Response message',
    example: 'Success',
    maxLength: 50,
  })
  msg: string;

  @ApiProperty({
    description: 'Response data',
    type: DcsResponseDataDto,
  })
  data?: DcsResponseDataDto | {};
}
