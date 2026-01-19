import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AggregatorStatus } from '@repo/database';

export class AggregatorResponseDto {
    @ApiProperty({ description: 'Aggregator ID', example: '1' })
    id!: string;

    @ApiProperty({ description: 'Aggregator Name', example: 'DC ACE' })
    name!: string;

    @ApiProperty({ description: 'Aggregator Code', example: 'DC' })
    code!: string;

    @ApiProperty({ enum: AggregatorStatus, description: 'Aggregator Status' })
    status!: AggregatorStatus;

    @ApiProperty({ description: 'API Communication Enabled', example: true })
    apiEnabled!: boolean;

    @ApiProperty({ description: 'Created At' })
    createdAt!: Date;

    @ApiProperty({ description: 'Updated At' })
    updatedAt!: Date;
}
