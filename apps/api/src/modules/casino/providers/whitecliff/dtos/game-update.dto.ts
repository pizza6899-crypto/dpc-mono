import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

// 지원되는 언어 코드 목록
const SUPPORTED_LANGUAGES = [
  'sq',
  'hu',
  'ar',
  'id',
  'hy',
  'it',
  'bg',
  'ja',
  'ca',
  'ko',
  'zh',
  'lv',
  'zh-Hans',
  'lt',
  'zh-Hant',
  'ms',
  'hr',
  'mn',
  'cs',
  'no',
  'da',
  'pl',
  'nl',
  'pt-PT',
  'en',
  'pt',
  'en-GB',
  'pt-BR',
  'en-NL',
  'ro',
  'en-150',
  'ru',
  'et',
  'sr',
  'fi',
  'sk',
  'nl-BE',
  'sl',
  'fr',
  'es',
  'fr-CA',
  'es-US',
  'ka',
  'sv',
  'de',
  'th',
  'el',
  'tr',
  'he',
  'uk',
  'hi',
  'vi',
] as const;

export class GameListUpdateResponseDto {
  @ApiProperty({
    description: '업데이트 성공 여부',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '응답 메시지',
    example: '게임 목록 업데이트가 시작되었습니다.',
  })
  message: string;
}

export class GameListUpdateStatusDto {
  @ApiProperty({
    description: '업데이트 실행 중 여부',
    example: false,
  })
  isRunning: boolean;

  @ApiProperty({
    description: '마지막 업데이트 시간',
    example: '2024-01-15T10:30:00.000Z',
    required: false,
  })
  lastUpdate?: Date;

  @ApiProperty({
    description: '진행 상황',
    required: false,
    type: 'array',
    items: {
      type: 'object',
      properties: {
        total: { type: 'number', description: '총 게임 수', example: 1000 },
        processed: {
          type: 'number',
          description: '처리된 게임 수',
          example: 500,
        },
        created: { type: 'number', description: '생성된 게임 수', example: 50 },
        updated: {
          type: 'number',
          description: '업데이트된 게임 수',
          example: 400,
        },
        disabled: {
          type: 'number',
          description: '비활성화된 게임 수',
          example: 50,
        },
      },
    },
  })
  progress?: {
    total: number;
    processed: number;
    created: number;
    updated: number;
    disabled: number;
  };

  @ApiProperty({
    description: '오류 메시지',
    example: 'API 연결 실패',
    required: false,
  })
  error?: string;
}

export class GameListUpdateRequestDto {
  @ApiProperty({
    description: '게임 목록을 업데이트할 언어 코드',
    example: 'en',
    enum: SUPPORTED_LANGUAGES,
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(SUPPORTED_LANGUAGES, {
    message: `지원되지 않는 언어 코드입니다. 지원되는 언어: ${SUPPORTED_LANGUAGES.join(', ')}`,
  })
  language: string;
}
