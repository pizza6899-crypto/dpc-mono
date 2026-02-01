import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Language } from '@prisma/client';

export class GetAvailableRewardsQueryDto {
    @ApiPropertyOptional({
        description: 'Language for translation / 번역 언어 선택',
        enum: Language,
        default: Language.EN,
    })
    @IsOptional()
    @IsEnum(Language)
    lang?: Language = Language.EN;
}
