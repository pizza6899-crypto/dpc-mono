import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BannerResponseDto {
  @ApiProperty({ description: '정렬 순서 / Order', example: 1 })
  order!: number;

  @ApiPropertyOptional({ description: '기본 링크 URL / Default link URL', example: 'https://example.com' })
  linkUrl?: string;

  @ApiPropertyOptional({ description: '직접 이미지 URL / Image URL', example: 'https://cdn.example.com/banners/spring.jpg' })
  imageUrl?: string;

  @ApiPropertyOptional({ description: '배너 제목 / Title', example: 'Spring Sale / 봄 세일' })
  title?: string;

  @ApiPropertyOptional({ description: 'ALT 텍스트 / Alt text', example: 'Spring Sale Banner / 봄 할인 배너' })
  altText?: string;
}
