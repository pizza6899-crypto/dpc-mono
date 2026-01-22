import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// 공통 응답 데이터 DTO
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

// 공통 응답 DTO
export class DcsCommonResponseDto {
  @ApiProperty({
    description: 'DCS API Response Code',
    example: 1,
    type: Number,
  })
  code: number;

  @ApiProperty({
    description: 'Response message (Success for valid requests)',
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

// Login Request/Response
export class LoginRequestDto {
  @ApiProperty({
    description: 'Brand ID',
    example: 'brand123',
  })
  brand_id: string;

  @ApiProperty({
    description: 'Sign (MD5 hash: brand_id+token+api_key)',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  })
  sign: string;

  @ApiProperty({
    description: 'Token created by operator (only English letters and numbers)',
    example: 'abc123XYZ456',
  })
  token: string;

  @ApiProperty({
    description:
      'Unique User ID from operator (only English characters and numbers, case insensitive)',
    example: 'user123ABC',
  })
  brand_uid: string;

  @ApiProperty({
    description: 'Player currency code',
    example: 'USD',
  })
  currency: string;
}

export class DcsLoginResponseDto extends DcsCommonResponseDto { }

// Wager Request/Response
export class WagerRequestDto {
  @ApiProperty({
    description: 'Brand ID',
    example: 'brand123',
    maxLength: 9,
  })
  brand_id: string;

  @ApiProperty({
    description: 'Sign (MD5 hash: brand_id+wager_id+api_key)',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    maxLength: 32,
  })
  sign: string;

  @ApiProperty({
    description: 'Token created by operator (only English letters and numbers)',
    example: 'abc123XYZ456',
    maxLength: 32,
  })
  token: string;

  @ApiProperty({
    description:
      'Unique User ID from operator (only English characters and numbers, case insensitive)',
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
    description: 'Bet amount',
    example: 100.0,
    type: Number,
  })
  amount: number;

  @ApiProperty({
    description: 'A portion of player bet amount add to Jackpot feed',
    example: 0.1,
    type: Number,
  })
  jackpot_contribution: number;

  @ApiProperty({
    description: 'DC game ID',
    example: 12345,
    type: Number,
  })
  game_id: number;

  @ApiProperty({
    description: 'DC Game Name',
    example: 'Slot Game 1',
    maxLength: 50,
  })
  game_name: string;

  @ApiProperty({
    description: 'Unique bet round identifier',
    example: 'round123456789',
    maxLength: 64,
  })
  round_id: string;

  @ApiProperty({
    description: 'Unique transaction identifier within a bet round',
    example: 'wager123456789',
    maxLength: 64,
  })
  wager_id: string;

  @ApiProperty({
    description: 'Game provider code',
    example: 'PROVIDER01',
    maxLength: 20,
  })
  provider: string;

  @ApiProperty({
    description: 'Bet type (1=Normal; 2=Tip)',
    example: 1,
    type: Number,
    enum: [1, 2],
  })
  bet_type: number;

  @ApiProperty({
    description: 'Round finish status (false=Unfinished, true=Round Finish)',
    example: false,
    type: Boolean,
  })
  is_endround: boolean;

  @ApiProperty({
    description: 'Transaction time (format: yyyy-MM-ddTHH:mm:ssZ)',
    example: '2024-01-01T00:00:00Z',
    maxLength: 20,
  })
  transaction_time: string;
}

export class WagerResponseDto extends DcsCommonResponseDto { }

// Cancel Wager Request/Response
export class CancelWagerRequestDto {
  @ApiProperty({
    description: 'Brand ID',
    example: 'brand123',
    maxLength: 9,
  })
  brand_id: string;

  @ApiProperty({
    description: 'Sign (MD5 hash: brand_id+wager_id+api_key)',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    maxLength: 32,
  })
  sign: string;

  @ApiProperty({
    description:
      'Unique User ID from operator (only English characters and numbers, case insensitive)',
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
    description: 'Unique bet round identifier',
    example: 'round123456789',
    maxLength: 64,
  })
  round_id: string;

  @ApiProperty({
    description: 'Unique transaction identifier within a bet round',
    example: 'wager123456789',
    maxLength: 64,
  })
  wager_id: string;

  @ApiProperty({
    description: 'Game provider code',
    example: 'PROVIDER01',
    maxLength: 20,
  })
  provider: string;

  @ApiProperty({
    description: 'Wager type (1=cancelWager, 2=cancelEndWager)',
    example: 1,
    type: Number,
    enum: [1, 2],
  })
  wager_type: number;

  @ApiProperty({
    description: 'Round finish status (false=Unfinished, true=Round Finish)',
    example: false,
    type: Boolean,
  })
  is_endround: boolean;

  @ApiProperty({
    description: 'Transaction time (format: yyyy-MM-ddTHH:mm:ssZ)',
    example: '2024-01-01T00:00:00Z',
    maxLength: 20,
  })
  transaction_time: string;
}

export class CancelWagerResponseDto extends DcsCommonResponseDto { }

// Append Wager Request/Response
export class AppendWagerRequestDto {
  @ApiProperty({
    description: 'Brand ID',
    example: 'brand123',
    maxLength: 9,
  })
  brand_id: string;

  @ApiProperty({
    description: 'Sign (MD5 hash: brand_id+wager_id+api_key)',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    maxLength: 32,
  })
  sign: string;

  @ApiProperty({
    description:
      'Unique User ID from operator (only English characters and numbers, case insensitive)',
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
    description: 'Player jackpot winning amount',
    example: 50.0,
    type: Number,
  })
  amount: number;

  @ApiProperty({
    description: 'DC game ID',
    example: 12345,
    type: Number,
  })
  game_id: number;

  @ApiProperty({
    description: 'DC Game Name',
    example: 'Slot Game 1',
    maxLength: 50,
  })
  game_name: string;

  @ApiProperty({
    description: 'Unique bet round identifier',
    example: 'round123456789',
    maxLength: 64,
  })
  round_id: string;

  @ApiProperty({
    description: 'Unique transaction identifier within a bet round',
    example: 'wager123456789',
    maxLength: 64,
  })
  wager_id: string;

  @ApiProperty({
    description: 'Game provider code',
    example: 'PROVIDER01',
    maxLength: 20,
  })
  provider: string;

  @ApiProperty({
    description: 'Description of appendWager',
    example: 'Additional wager for jackpot',
    maxLength: 100,
  })
  description: string;

  @ApiProperty({
    description: 'Round finish status (false=Unfinished, true=Round Finish)',
    example: false,
    type: Boolean,
  })
  is_endround: boolean;

  @ApiProperty({
    description: 'Transaction time (format: yyyy-MM-ddTHH:mm:ssZ)',
    example: '2024-01-01T00:00:00Z',
    maxLength: 20,
  })
  transaction_time: string;
}

export class AppendWagerResponseDto extends DcsCommonResponseDto { }

// End Wager Request/Response
export class EndWagerRequestDto {
  @ApiProperty({
    description: 'Brand ID',
    example: 'brand123',
    maxLength: 9,
  })
  brand_id: string;

  @ApiProperty({
    description: 'Sign (MD5 hash: brand_id+wager_id+api_key)',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    maxLength: 32,
  })
  sign: string;

  @ApiProperty({
    description:
      'Unique User ID from operator (only English characters and numbers, case insensitive)',
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
    description: 'Player winning amount in normal round',
    example: 200.0,
    type: Number,
  })
  amount: number;

  @ApiProperty({
    description: 'Unique bet round identifier',
    example: 'round123456789',
    maxLength: 64,
  })
  round_id: string;

  @ApiProperty({
    description: 'Unique transaction identifier within a bet round',
    example: 'wager123456789',
    maxLength: 64,
  })
  wager_id: string;

  @ApiProperty({
    description: 'Game provider code',
    example: 'PROVIDER01',
    maxLength: 20,
  })
  provider: string;

  @ApiProperty({
    description: 'Round finish status (false=Unfinished, true=Round Finish)',
    example: false,
    type: Boolean,
  })
  is_endround: boolean;

  @ApiPropertyOptional({
    description:
      'Game result (Only Ezugi has game result, the other provider will be null)',
    example: null,
    maxLength: 4000,
  })
  game_result?: string;

  @ApiProperty({
    description: 'Transaction time (format: yyyy-MM-ddTHH:mm:ssZ)',
    example: '2024-01-01T00:00:00Z',
    maxLength: 20,
  })
  transaction_time: string;
}

export class EndWagerResponseDto extends DcsCommonResponseDto { }

// Free Spin Result Request/Response
export class FreeSpinResultRequestDto {
  @ApiProperty({
    description: 'Brand ID',
    example: 'brand123',
    maxLength: 9,
  })
  brand_id: string;

  @ApiProperty({
    description: 'Sign (MD5 hash: brand_id+wager_id+api_key)',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    maxLength: 32,
  })
  sign: string;

  @ApiProperty({
    description:
      'Unique User ID from operator (only English characters and numbers, case insensitive)',
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
    description: 'Player winning amount in campaign',
    example: 50.0,
    type: Number,
  })
  amount: number;

  @ApiProperty({
    description: 'DC game ID',
    example: 12345,
    type: Number,
  })
  game_id: number;

  @ApiProperty({
    description: 'DC Game Name',
    example: 'Slot Game 1',
    maxLength: 50,
  })
  game_name: string;

  @ApiProperty({
    description: 'Unique bet round identifier',
    example: 'round123456789',
    maxLength: 64,
  })
  round_id: string;

  @ApiProperty({
    description: 'Unique transaction identifier within a bet round',
    example: 'wager123456789',
    maxLength: 64,
  })
  wager_id: string;

  @ApiProperty({
    description: 'Game provider code',
    example: 'PROVIDER01',
    maxLength: 20,
  })
  provider: string;

  @ApiProperty({
    description: 'Round finish status (false=Unfinished, true=Round Finish)',
    example: false,
    type: Boolean,
  })
  is_endround: boolean;

  @ApiPropertyOptional({
    description: 'freespin_id from the response of 2.7 createFreeSpin',
    example: 123456789,
    type: Number,
  })
  freespin_id?: number;

  @ApiPropertyOptional({
    description: 'FreeSpin campaign description',
    example: 'Welcome Bonus Free Spin',
    maxLength: 100,
  })
  freespin_description?: string;

  @ApiProperty({
    description: 'Transaction time (format: yyyy-MM-ddTHH:mm:ssZ)',
    example: '2024-01-01T00:00:00Z',
    maxLength: 20,
  })
  transaction_time: string;
}

export class FreeSpinResultResponseDto extends DcsCommonResponseDto { }

// Get Balance Request/Response
export class GetDcsBalanceRequestDto {
  @ApiProperty({
    description: 'Brand ID',
    example: 'brand123',
    maxLength: 9,
  })
  brand_id: string;

  @ApiProperty({
    description: 'Sign (MD5 hash: brand_id+token+api_key)',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    maxLength: 32,
  })
  sign: string;

  @ApiProperty({
    description:
      'Unique User ID from operator (only English characters and numbers, case insensitive)',
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
    description: 'Token created by operator (only English letters and numbers)',
    example: 'abc123XYZ456',
    maxLength: 32,
  })
  token: string;
}

export class GetDcsBalanceResponseDto extends DcsCommonResponseDto { }

// Promo Payout Request/Response
export class PromoPayoutRequestDto {
  @ApiProperty({
    description: 'Brand ID',
    example: 'brand123',
    maxLength: 9,
  })
  brand_id: string;

  @ApiProperty({
    description: 'Sign (MD5 hash: brand_id+promotion_id+trans_id+api_key)',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    maxLength: 32,
  })
  sign: string;

  @ApiProperty({
    description:
      'Unique User ID from operator (only English characters and numbers, case insensitive)',
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
    description: 'Promo bonus',
    example: 100.0,
    type: Number,
  })
  amount: number;

  @ApiProperty({
    description: 'Promotion id',
    example: 'promo-123e4567-e89b-12d3-a456-426614174000',
    maxLength: 36,
  })
  promotion_id: string;

  @ApiProperty({
    description: 'Trans id',
    example: 'trans123456789',
    maxLength: 128,
  })
  trans_id: string;

  @ApiProperty({
    description: 'Game provider code',
    example: 'PROVIDER01',
    maxLength: 16,
  })
  provider: string;

  @ApiProperty({
    description: 'Transaction time (format: yyyy-MM-ddTHH:mm:ssZ)',
    example: '2024-01-01T00:00:00Z',
    maxLength: 20,
  })
  transaction_time: string;
}

export class PromoPayoutResponseDto extends DcsCommonResponseDto { }
