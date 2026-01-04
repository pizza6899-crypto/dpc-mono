import { IsEnum, IsNumberString, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Language } from '@repo/database';

export class TierParamDto {
    @ApiProperty({ description: 'Tier ID / 티어 ID', example: '1' })
    @IsNumberString()
    id: string;
}

export class TierTranslationParamDto extends TierParamDto {
    @ApiProperty({ enum: Language, description: 'Language code / 언어 코드', example: Language.EN })
    @IsEnum(Language)
    language: Language;
}
