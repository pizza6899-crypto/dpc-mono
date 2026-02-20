import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Language } from '@prisma/client';

export class GetUserTierQueryDto {
  @ApiProperty({
    enum: Language,
    required: false,
    description: 'Language for tier names / 티어 이름 표시 언어',
    default: Language.EN,
  })
  @IsOptional()
  @IsEnum(Language)
  lang: Language = Language.EN;
}
