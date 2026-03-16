import { ApiProperty } from '@nestjs/swagger';

export class UploadFileAdminRequestDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: '업로드할 파일 (Upload File)',
    required: true,
  })
  file: any;
}
