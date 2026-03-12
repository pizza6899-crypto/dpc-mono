import { ApiProperty } from '@nestjs/swagger';

export class QuestConfigAdminResponseDto {
  @ApiProperty({ description: 'System enabled status / 시스템 활성화 여부' })
  isSystemEnabled: boolean;

  @ApiProperty({ description: 'Last updated at / 최종 수정일' })
  updatedAt: Date;
}
