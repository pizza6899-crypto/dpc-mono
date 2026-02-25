import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminCompConfigResponseDto {
  @ApiProperty({ description: 'Config ID' })
  id: string;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Is earning enabled' })
  isEarnEnabled: boolean;

  @ApiProperty({ description: 'Is settlement enabled' })
  isSettlementEnabled: boolean;

  @ApiProperty({ description: 'Minimum settlement amount as string' })
  minSettlementAmount: string;

  @ApiProperty({ description: 'Max daily earn limit per user as string' })
  maxDailyEarnPerUser: string;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}
