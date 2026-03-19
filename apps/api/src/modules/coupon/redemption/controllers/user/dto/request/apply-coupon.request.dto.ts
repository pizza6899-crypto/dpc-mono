import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ApplyCouponRequestDto {
  @ApiProperty({
    description: 'Coupon code to apply / 적용할 쿠폰 코드',
    example: 'WELCOME2024',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;
}
