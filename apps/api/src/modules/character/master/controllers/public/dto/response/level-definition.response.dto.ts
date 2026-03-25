import { ApiProperty } from '@nestjs/swagger';

/**
 * 일반 사용자용 레벨 정의 응답 DTO (UI UX 미정에 따른 간소화 버전)
 */
export class LevelDefinitionResponseDto {
  @ApiProperty({ description: 'Level / 레벨', example: 1 })
  level: number;

  @ApiProperty({ description: 'Required cumulative XP to achieve this level / 목표 누적 경험치', example: '1000' })
  requiredXp: string;
}
