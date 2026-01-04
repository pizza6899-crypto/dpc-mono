import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Language } from '@repo/database';

export class UpdateTierTranslationDto {
    @ApiProperty({ description: 'Tier name / 티어 이름', example: 'Gold' })
    @IsString()
    name: string;
}
