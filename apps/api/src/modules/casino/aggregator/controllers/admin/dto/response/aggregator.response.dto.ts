import { ApiProperty } from '@nestjs/swagger';
import { AggregatorStatus } from '@repo/database';
import { CasinoAggregator } from '../../../../domain';

export class AggregatorResponseDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    name!: string;

    @ApiProperty()
    code!: string;

    @ApiProperty({ enum: AggregatorStatus })
    status!: AggregatorStatus;

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty()
    updatedAt!: Date;

    static from(aggregator: CasinoAggregator): AggregatorResponseDto {
        const dto = new AggregatorResponseDto();
        dto.id = aggregator.id!.toString();
        dto.name = aggregator.name;
        dto.code = aggregator.code;
        dto.status = aggregator.status;
        dto.createdAt = aggregator.createdAt;
        dto.updatedAt = aggregator.updatedAt;
        return dto;
    }
}
