import { ApiProperty } from '@nestjs/swagger';

export class FileAdminResponseDto {
  @ApiProperty({
    description: '파일의 공유 ID (Public ID of the file).',
    example: 'f_38s7d',
  })
  id: string;

  @ApiProperty({
    description: '파일에 접근할 수 있는 전체 URL (Full URL to access the file).',
    example: 'https://cdn.example.com/public/xy77s.jpg',
    required: false,
  })
  url?: string;
}
