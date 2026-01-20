import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetBonusRequestDto {
  @ApiProperty({
    description: 'User ID of WHITECLIFF. WC 멤버 ID.',
    example: 1000011,
    type: 'integer',
  })
  @IsNumber()
  user_id: number;

  @ApiProperty({
    description:
      'Bonus type: 0 = In Game Bonus (인 게임 보너스), 1 = Promotion (프로모션 보너스), 2 = Jackpot (잭팟 보너스)',
    example: 0,
    type: 'integer',
    enum: [0, 1, 2],
  })
  @IsNumber()
  @IsNotEmpty()
  type: number;

  @ApiProperty({
    description: 'Amount of the bonus. 보너스 금액.',
    example: 2000.0,
    type: 'number',
    format: 'decimal',
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: "Product's ID. WC 제품ID.",
    example: 1,
    type: 'integer',
  })
  @IsNumber()
  @IsNotEmpty()
  prd_id: number;

  @ApiProperty({
    description: 'Transaction ID of the bonus. 보너스 트랜잭션 ID.',
    example: '60000001000010001',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  txn_id: string;

  @ApiProperty({
    description: "Games' ID. 게임ID.",
    example: 1,
    type: 'integer',
  })
  @IsNumber()
  @IsNotEmpty()
  game_id: number;

  @ApiProperty({
    description: 'Session ID. 세션ID. 비고를 참조하십시오.',
    example: 'session123456',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  sid: string;

  @ApiProperty({
    description: 'Round ID of the bet. 라운드ID.',
    example: '999999999',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  round_id: string;

  @ApiProperty({
    description:
      'Promotion Reference ID (Optional): This field is applicable only for bonuses issued as part of a Product Promotion Event. Otherwise, this field is not applicable. 프로모션 참조 ID (선택사항): 이 필드는 프로모션 이벤트의 보너스 발급 시에만 적용되며, 그 외에는 해당되지 않습니다.',
    example: 'promo_ref_123',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  freespin_id: string;

  @ApiPropertyOptional({
    description:
      "If the value is 'True', it means the promotion for the member has been finished. (Optional): This field is applicable only for bonuses issued as part of a Product Promotion Event. Otherwise, this field is not applicable. 값이 'True'이면, 해당 회원의 프로모션은 완료된 상태입니다. (선택사항): 이 필드는 프로모션 이벤트의 보너스 발급 시에만 적용되며, 그 외에는 해당되지 않습니다.",
    example: false,
    type: 'boolean',
  })
  @IsOptional()
  @IsBoolean()
  is_endround: boolean;
}

export class GetBonusResponseDto {
  @ApiProperty({
    description: 'Response status code',
    example: 200,
    type: 'integer',
  })
  status: number;

  @ApiProperty({
    description: 'User balance after bonus processing',
    example: 5000.0,
    type: 'number',
    format: 'decimal',
  })
  balance: number;

  @ApiPropertyOptional({
    description: 'Error code if bonus processing failed',
    example: 'INVALID_USER',
    type: 'string',
    enum: [
      'INVALID_USER',
      'ACCESS_DENIED',
      'INVALID_TXN',
      'INTERNAL_ERROR',
      'INVALID_PRODUCT',
      'DUPLICATE_BONUS',
    ],
  })
  error?: string;
}
