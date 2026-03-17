import { ApiProperty } from '@nestjs/swagger';
import { Language } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateMyLanguageRequestDto {
    @ApiProperty({
        description: 'Language setting / 언어 설정',
        enum: Language,
        example: Language.KO
    })
    @IsNotEmpty()
    @IsEnum(Language)
    language: Language;
}
