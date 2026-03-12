import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateQuestConfigAdminDto {
  @ApiProperty({
    description: 'System enabled status / 시스템 활성화 여부',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isSystemEnabled?: boolean;
}
