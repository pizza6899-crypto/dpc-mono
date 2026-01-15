import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString } from 'class-validator';

export class AdminUpdateGameRequestDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isEnabled?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isVisibleToUser?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    iconLink?: string;
}
