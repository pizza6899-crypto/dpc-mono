import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Language } from '@prisma/client';

export class BannerListQueryDto {
  @ApiPropertyOptional({ description: '언어 코드 / language', enum: Language, default: Language.EN })
  @IsOptional()
  language?: Language;
}
