import { IsEnum, IsJSON, IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AggregatorStatus } from '@repo/database';
import type { AggregatorConfig } from '../../../../domain';

export class CreateAggregatorDto {
    @ApiProperty({ description: '애그리게이터 이름' })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ description: '애그리게이터 코드 (유니크)' })
    @IsString()
    @IsNotEmpty()
    code!: string;

    @ApiProperty({ description: '애그리게이터 상태', enum: AggregatorStatus })
    @IsEnum(AggregatorStatus)
    status!: AggregatorStatus;

    @ApiProperty({ description: '애그리게이터 설정 JSON' })
    @IsObject()
    config!: AggregatorConfig;
}
