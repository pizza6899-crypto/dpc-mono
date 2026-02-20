import { IsEnum, IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Language } from '@prisma/client';

export class TemplateTranslationParamDto {
  @ApiProperty({ description: 'Template ID', example: '1' })
  @IsNumberString()
  id: string;

  @ApiProperty({ description: 'Locale', enum: Language, example: Language.EN })
  @IsEnum(Language)
  locale: Language;
}
