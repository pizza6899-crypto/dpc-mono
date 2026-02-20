import { ApiProperty } from '@nestjs/swagger';

export class FileResponseDto {
  @ApiProperty({
    description:
      '파일의 공유 ID (Public ID of the file). \n이 ID는 파일 첨부 API (/file/attach)를 호출할 때 사용됩니다. (This ID is used when calling the file attach API).',
    example: 'f_38s7d',
  })
  id: string;

  @ApiProperty({
    description:
      '파일에 접근할 수 있는 전체 URL (Full URL to access the file). \nCDN이 적용된 최적화된 URL입니다. (This is an optimized URL with CDN applied). \n이미지 태그의 src 속성에 바로 사용할 수 있습니다. (Can be used directly in the src attribute of an image tag).',
    example: 'https://cdn.example.com/public/xy77s.jpg',
    required: false,
  })
  url?: string;
}
