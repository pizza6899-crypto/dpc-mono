import { ApiProperty } from '@nestjs/swagger';
import { TierChangeType } from '@prisma/client';

export class UserTierHistoryAdminResponseDto {
  @ApiProperty({ description: 'History record ID / 이력 레코드 ID' })
  id: string;

  @ApiProperty({ nullable: true, description: 'Source tier ID / 이전 티어 ID' })
  fromTierId: string | null;

  @ApiProperty({ description: 'Target tier ID / 변경된 티어 ID' })
  toTierId: string;

  @ApiProperty({
    enum: TierChangeType,
    description: 'Type of tier change / 변경 유형',
  })
  changeType: TierChangeType;

  @ApiProperty({ nullable: true, description: 'Reason for change / 변경 사유' })
  reason: string | null;

  @ApiProperty({ description: 'Date of change / 변경 일시' })
  changedAt: Date;

  @ApiProperty({
    description: 'XP status snapshot / 판정용 XP 스냅샷',
  })
  statusExpSnap: string;

  @ApiProperty({ description: 'Bonus amount generated / 발생한 보너스 금액' })
  upgradeBonusSnap: string;

  @ApiProperty({ description: 'Reward currency / 보상 통화' })
  currency: string;
}
