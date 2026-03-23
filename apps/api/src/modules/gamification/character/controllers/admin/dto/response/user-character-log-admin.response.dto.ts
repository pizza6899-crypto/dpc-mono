import { ApiProperty } from '@nestjs/swagger';
import { CharacterLogType } from '@prisma/client';

/**
 * [Admin] 캐릭터 활동 로그 응답 DTO
 */
export class UserCharacterLogResponseDto {
  @ApiProperty({ description: 'Log ID / 로그 ID', example: '1' })
  id: string;

  @ApiProperty({ description: 'Log Type / 로그 타입', enum: CharacterLogType })
  type: CharacterLogType;

  @ApiProperty({ description: 'Level before update / 변경 전 레벨', example: 10 })
  beforeLevel: number;

  @ApiProperty({ description: 'Level after update / 변경 후 레벨', example: 11 })
  afterLevel: number;

  @ApiProperty({ description: 'Stat points before update / 변경 전 스탯 포인트', example: 5 })
  beforeStatPoints: number;

  @ApiProperty({ description: 'Stat points after update / 변경 후 스탯 포인트', example: 10 })
  afterStatPoints: number;

  @ApiProperty({ description: 'Additional details / 상세 내용', example: { reason: 'XP_GAIN' } })
  details: any;

  @ApiProperty({ description: 'Created At / 생성 일시', example: '2026-03-23T10:00:00Z' })
  createdAt: Date;
}
