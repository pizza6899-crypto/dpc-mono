import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Language } from '@prisma/client';

export class TierPublicQueryDto {
  @ApiProperty({
    enum: Language,
    required: false,
    description: 'Language for translation (Default: EN) / 번역 언어 선택',
  })
  @IsOptional()
  @IsEnum(Language)
  lang?: Language;

  @ApiProperty({
    required: false,
    description: 'Filter by Encoded Tier ID / 인코딩된 티어 ID로 필터링',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    required: false,
    description:
      'Filter by Tier Code (e.g., BRONZE, GOLD) / 티어 코드로 필터링',
  })
  @IsOptional()
  @IsString()
  code?: string;
}
