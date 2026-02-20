import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { DcsBaseRequestDto, DcsCommonResponseDto } from './base.dto';

export class PromoPayoutRequestDto extends DcsBaseRequestDto {
  @ApiProperty({
    description: 'Promo bonus',
    example: 100.0,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    description: 'Promotion id',
    example: 'promo-123e4567-e89b-12d3-a456-426614174000',
    maxLength: 36,
  })
  @IsString()
  @IsNotEmpty()
  promotion_id: string;

  @ApiProperty({
    description: 'Trans id',
    example: 'trans123456789',
    maxLength: 128,
  })
  @IsString()
  @IsNotEmpty()
  trans_id: string;

  @ApiProperty({
    description: 'Game provider code',
    example: 'PROVIDER01',
    maxLength: 16,
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
}

export class PromoPayoutResponseDto extends DcsCommonResponseDto {}
