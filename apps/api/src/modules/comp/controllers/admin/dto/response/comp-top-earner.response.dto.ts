import { ApiProperty } from '@nestjs/swagger';

export class CompTopEarnerResponseDto {
  @ApiProperty({ description: 'User ID', example: '123' })
  userId: string;

  @ApiProperty({
    description: 'Total points earned by this user',
    example: '50000.00',
  })
  totalEarned: string;
}
