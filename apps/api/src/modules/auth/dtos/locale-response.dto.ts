import { ApiProperty } from '@nestjs/swagger';

export class LocaleResponseDto {
  @ApiProperty({
    description: 'Changed locale',
    example: 'ko',
    enum: ['ko', 'en', 'ja', 'zh'],
  })
  language: string;
}
