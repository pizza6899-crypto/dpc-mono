import { ApiProperty } from '@nestjs/swagger';

export class FileUserResponseDto {
  @ApiProperty({
    description: '파일의 공유 ID (Public ID of the file).',
    example: 'f_38s7d',
  })
  id: string;
}
