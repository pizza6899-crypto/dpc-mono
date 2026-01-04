import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TierUserListQueryDto {
    @ApiProperty({ description: 'Page number / 페이지 번호', required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiProperty({ description: 'Page size / 페이지 당 개수', required: false, default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    get skip(): number {
        return ((this.page ?? 1) - 1) * (this.limit ?? 20);
    }

    get take(): number {
        return this.limit ?? 20;
    }
}
