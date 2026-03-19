import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class SendSupportMessageUserRequestDto {
  @ApiProperty({
    description: 'Content / 메시지 내용',
    example: 'I have a question.',
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'Image File IDs (Encoded) / 첨부 이미지 파일 ID 리스트',
    type: [String],
    example: ['f_1', 'f_2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageIds?: string[];
}
