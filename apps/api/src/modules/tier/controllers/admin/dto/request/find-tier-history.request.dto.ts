import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumberString, IsOptional, IsString, Min } from 'class-validator';

export class FindTierHistoryRequestDto {
    @ApiPropertyOptional({ description: 'User ID' })
    @IsOptional()
    @IsNumberString()
    userId?: string;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 20;
}
