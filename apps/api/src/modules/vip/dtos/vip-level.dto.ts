import { ApiProperty } from '@nestjs/swagger';

export class VipLevelResponseDto {
  @ApiProperty({ description: 'VIP 레벨 ID' })
  id: number;

  @ApiProperty({ description: '다국어 키' })
  nameKey: string;

  @ApiProperty({ description: '레벨 순위' })
  rank: number;

  @ApiProperty({ description: '필요 롤링' })
  requiredRolling: number;

  @ApiProperty({ description: '레벨업 보너스' })
  levelUpBonus: number;

  @ApiProperty({ description: '콤프 비율' })
  compRate: number;
}

export class VipLevelListResponseDto {
  @ApiProperty({ type: [VipLevelResponseDto] })
  levels: VipLevelResponseDto[];
}
