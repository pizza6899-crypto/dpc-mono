import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { WithdrawalStatus } from '@repo/database';

export class GetAdminWithdrawalsQueryDto {
    @ApiPropertyOptional({
        description: 'Filter by status',
        enum: WithdrawalStatus,
        default: WithdrawalStatus.PENDING_REVIEW,
    })
    @IsOptional()
    @IsEnum(WithdrawalStatus)
    status?: WithdrawalStatus;

    @ApiPropertyOptional({
        description: 'Page number',
        default: 1,
        minimum: 1,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Transform(({ value }) => parseInt(value, 10))
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Items per page',
        default: 50,
        minimum: 1,
        maximum: 100,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Transform(({ value }) => parseInt(value, 10))
    limit?: number = 50;
}
