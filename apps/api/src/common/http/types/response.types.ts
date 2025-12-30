import { ApiProperty } from '@nestjs/swagger';
import { MessageCode } from './message-codes';

export class ApiResponseDto<T = any> {
  @ApiProperty({
    example: true,
    default: true,
    description: 'Success (성공 여부)',
  })
  success?: boolean;

  @ApiProperty({ description: 'Response data (응답 데이터)', required: false })
  data?: T;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Response time (응답 시간)',
  })
  timestamp?: string;

  @ApiProperty({
    example: 200,
    description: 'HTTP status code (HTTP 상태 코드)',
  })
  statusCode?: number;
}

export class ErrorResponseDto {
  @ApiProperty({
    example: false,
    default: false,
    description: 'Success (성공 여부)',
  })
  success: boolean;

  @ApiProperty({
    example: MessageCode.AUTH_INVALID_TOKEN,
    enum: MessageCode,
    description: `
    Error message code. (에러 메시지 코드)
    The frontend receives this code and displays a translated message according to the user's locale using i18n. (프론트엔드에서는 이 코드값을 받아 유저의 로케일에 맞게 i18n 번역 처리하여 메시지를 출력합니다.)
    `,
  })
  messageCode: MessageCode;

  @ApiProperty({
    example: '',
    required: false,
    description: `
    Error message (usually empty, used only for specific API or DTO validation errors) /
    에러 메시지(일반적으로 빈 값이 반환되며, 특정 API나 DTO의 검증 에러에서만 사용됨)
    `,
  })
  message: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Response time (응답 시간)',
  })
  timestamp: string;

  @ApiProperty({
    example: 400,
    description: 'HTTP status code (HTTP 상태 코드)',
  })
  statusCode: number;
}
