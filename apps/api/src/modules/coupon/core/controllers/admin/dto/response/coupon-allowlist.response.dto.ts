import { ApiProperty } from '@nestjs/swagger';

export class CouponAllowlistResponseDto {
  @ApiProperty({ example: '123456789012345678', description: 'User ID / 유저 ID' })
  userId: string;

  @ApiProperty({ description: 'Registered At / 등록일' })
  createdAt: Date;
}
