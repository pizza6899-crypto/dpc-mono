import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * @description 나우페이먼트 콜백(IPN)에서 수신하는 가능한 모든 상태 값
 */
export type PaymentStatus =
  | 'waiting'
  | 'sending'
  | 'finished'
  | 'failed'
  | 'expired'
  | 'partially_paid'
  | 'refunded';

export class FeeDto {
  @ApiProperty({ description: '수수료 통화' })
  @IsString()
  currency: string;

  @ApiProperty({ description: '입금 수수료' })
  @IsNumber()
  depositFee: number;

  @ApiProperty({ description: '출금 수수료' })
  @IsNumber()
  withdrawalFee: number;

  @ApiProperty({ description: '서비스 수수료' })
  @IsNumber()
  serviceFee: number;
}

/**
 * @description 나우페이먼트 콜백으로 수신하는 데이터의 DTO
 * (제공된 필드 테이블을 기반으로 필수 필드만 정의)
 */
export class PaymentCallbackDto {
  @ApiProperty({ description: '결제 ID' })
  @IsString()
  @Transform(({ value }) => value?.toString())
  payment_id: string;

  @ApiProperty({ description: '결제 상태' })
  @IsEnum([
    'waiting',
    'sending',
    'finished',
    'failed',
    'expired',
    'partially_paid',
    'refunded',
  ])
  @IsString()
  payment_status: PaymentStatus;

  @ApiProperty({ description: '결제 주소' })
  @IsString()
  pay_address: string;

  @ApiProperty({ description: '원래 금액' })
  @IsNumber()
  price_amount: number;

  @ApiProperty({ description: '원래 통화' })
  @IsString()
  price_currency: string;

  @ApiProperty({ description: '결제 금액' })
  @IsNumber()
  pay_amount: number;

  @ApiProperty({ description: '결제 통화' })
  @IsString()
  pay_currency: string;

  @ApiProperty({ description: '주문 ID' })
  @IsString()
  order_id: string;

  @ApiProperty({ description: '주문 설명', required: false })
  @IsOptional()
  @IsString()
  order_description?: string;

  @ApiProperty({ description: 'IPN 콜백 URL' })
  @IsString()
  ipn_callback_url: string;

  @ApiProperty({ description: '생성 시간' })
  @IsString()
  created_at: string;

  @ApiProperty({ description: '업데이트 시간' })
  @IsString()
  updated_at: string;

  @ApiProperty({ description: '수신된 금액' })
  @IsNumber()
  amount_received: number;

  @ApiProperty({ description: '추가 ID', required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toString())
  payin_extra_id?: string;

  @ApiProperty({ description: '네트워크', required: false })
  @IsOptional()
  @IsString()
  network?: string;

  @ApiProperty({ description: '수수료 정보', type: FeeDto, required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => FeeDto)
  fee?: FeeDto;
}

export class NowPaymentCallbackResponseDto {
  @ApiProperty({ description: '응답 상태' })
  status: 'ok' | 'error';

  @ApiProperty({ description: '에러 메시지', required: false })
  message?: string;
}
