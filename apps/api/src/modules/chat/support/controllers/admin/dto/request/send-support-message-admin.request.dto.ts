import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class SendSupportMessageAdminRequestDto {
  @ApiProperty({
    description: 'Content / 메시지 내용',
    example: 'Thank you for your inquiry.',
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'Image File IDs / 첨부 이미지 파일 ID 리스트',
    type: [String],
    example: ['12345678', '87654321'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageIds?: string[];
}
