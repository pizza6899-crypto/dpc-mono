import { ApiPropertyOptional } from '@nestjs/swagger';
import { Language } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateMyProfileRequestDto {
  @ApiPropertyOptional({
    description: 'Language / 언어 설정',
    enum: Language,
    example: Language.KO,
  })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @ApiPropertyOptional({
    description: 'Timezone / 타임존',
    example: 'Asia/Seoul',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Phone Number / 휴대폰 번호',
    example: '+821012345678',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
