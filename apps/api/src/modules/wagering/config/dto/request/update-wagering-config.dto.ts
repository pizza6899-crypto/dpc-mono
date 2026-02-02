import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsBoolean, IsObject, Min } from 'class-validator';

export class UpdateWageringConfigDto {
    @ApiPropertyOptional({ description: 'Default bonus expiry days', example: 30 })
    @IsOptional()
    @IsInt()
    @Min(1)
    defaultBonusExpiryDays?: number;

    @ApiPropertyOptional({
        description: 'Currency settings (thresholds)',
        example: { KRW: { cancellationThreshold: 500 }, USD: { cancellationThreshold: 0.5 } }
    })
    @IsOptional()
    @IsObject()
    currencySettings?: any;

    @ApiPropertyOptional({ description: 'Enable wagering check on withdrawal', example: true })
    @IsOptional()
    @IsBoolean()
    isWageringCheckEnabled?: boolean;

    @ApiPropertyOptional({ description: 'Enable auto cancellation placement', example: true })
    @IsOptional()
    @IsBoolean()
    isAutoCancellationEnabled?: boolean;
}
