import { ApiProperty } from '@nestjs/swagger';

export class CompOverviewResponseDto {
  @ApiProperty({ description: 'Total earned comp points', example: '10000.00' })
  totalEarned: string;

  @ApiProperty({ description: 'Total used comp points', example: '5000.00' })
  totalUsed: string;

  @ApiProperty({ description: 'Point conversion rate', example: '50.0%' })
  conversionRate: string;
}
