import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTierTranslationDto {
    @ApiProperty({ description: 'Tier name / 티어 이름', example: 'Gold' })
    @IsString()
    @IsNotEmpty()
    name: string;
}
