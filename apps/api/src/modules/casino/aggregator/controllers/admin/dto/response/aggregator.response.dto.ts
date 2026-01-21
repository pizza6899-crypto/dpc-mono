import { ApiProperty } from '@nestjs/swagger';
import { AggregatorStatus } from '@prisma/client';

export class AggregatorResponseDto {
    @ApiProperty({ description: 'Aggregator ID / 애그리게이터 ID', example: '1' })
    id!: string;

    @ApiProperty({ description: 'Aggregator name / 애그리게이터 이름', example: 'DC ACE' })
    name!: string;

    @ApiProperty({ description: 'Aggregator code / 애그리게이터 코드', example: 'DC' })
    code!: string;

    @ApiProperty({ enum: AggregatorStatus, description: 'Aggregator status / 애그리게이터 상태' })
    status!: AggregatorStatus;

    @ApiProperty({ description: 'API enabled / API 호출 활성 여부', example: true })
    apiEnabled!: boolean;

    @ApiProperty({ description: 'Created date / 생성일' })
    createdAt!: Date;

    @ApiProperty({ description: 'Updated date / 수정일' })
    updatedAt!: Date;
}
