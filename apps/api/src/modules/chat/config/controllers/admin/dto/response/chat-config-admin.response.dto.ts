import { ApiProperty } from '@nestjs/swagger';

export class ChatConfigAdminResponseDto {
  @ApiProperty({
    description: 'Enable global chat / 글로벌 채팅 활성화 여부',
    example: true,
  })
  isGlobalChatEnabled: boolean;

  @ApiProperty({
    description: 'Maximum message length / 채팅 메시지 최대 길이',
    example: 500,
  })
  maxMessageLength: number;

  @ApiProperty({
    description: 'Default slow mode seconds / 도배 방지 쿨다운 (초)',
    example: 3,
  })
  defaultSlowModeSeconds: number;

  @ApiProperty({
    description:
      'Minimum tier level for chat / 채팅 참여를 위한 최소 티어 레벨',
    example: 0,
  })
  minChatTierLevel: number;

  @ApiProperty({
    description: 'Block duplicate messages / 중복 메시지 차단 여부',
    example: true,
  })
  blockDuplicateMessages: boolean;

  @ApiProperty({
    description: 'Last updated at / 마지막 수정 시각',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
