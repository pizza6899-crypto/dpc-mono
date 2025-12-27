import { ApiProperty } from '@nestjs/swagger';

export class ExceptionResponseDto {
  @ApiProperty({
    description: 'HTTP 상태 코드',
    example: 400,
    type: Number,
    required: true,
  })
  statusCode: number;

  @ApiProperty({
    description: '예외 이름',
    example: 'BadRequestException',
    type: String,
    required: true,
  })
  error: string;

  @ApiProperty({
    description: '에러 메시지 배열',
    example: ['Validation failed', 'Field is required'],
    type: [String],
    required: true,
  })
  message: string[];

  @ApiProperty({
    description: '원래 요청했던 이벤트 이름',
    example: 'message',
    type: String,
    required: true,
  })
  originalEvent: string;
}
