import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { AdminMemoTargetType } from '../../../../domain';

/**
 * 관리자 메모 조회 쿼리 DTO
 */
export class FindAdminMemosQueryDto {
    @ApiProperty({
        description: 'Target Type / 메모 대상 타입',
        example: 'DEPOSIT',
        enum: ['USER', 'DEPOSIT'],
    })
    @IsNotEmpty()
    @IsEnum(['USER', 'DEPOSIT'])
    targetType: AdminMemoTargetType;

    @ApiProperty({
        description: 'Target ID / 메모 대상 ID',
    })
    @IsNotEmpty()
    @IsString()
    targetId: string;

    @ApiProperty({
        description: 'Limit / 조회 개수',
        required: false,
        default: 50,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(500)
    limit?: number = 50;
}
