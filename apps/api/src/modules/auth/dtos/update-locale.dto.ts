import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLanguageDto {
  @ApiProperty({
    description: '사용자 로케일',
    example: 'ko',
    enum: ['ko', 'en', 'ja'],
  })
  @IsString()
  @IsIn(['ko', 'en', 'ja'], {
    message: '지원하지 않는 로케일입니다. ko, en, ja, zh 중에서 선택해주세요.',
  })
  language: string;
}
