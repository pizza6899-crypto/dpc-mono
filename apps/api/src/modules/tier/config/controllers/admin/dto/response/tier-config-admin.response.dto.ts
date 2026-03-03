import { ApiProperty } from '@nestjs/swagger';

export class TierConfigAdminResponseDto {
  @ApiProperty({
    description: 'Enable upgrade / 승급 활성화 여부',
    example: true,
  })
  isUpgradeEnabled: boolean;

  @ApiProperty({
    description: 'Enable downgrade / 강등 활성화 여부',
    example: false,
  })
  isDowngradeEnabled: boolean;

  @ApiProperty({
    description: 'Enable bonus / 보너스 활성화 여부',
    example: true,
  })
  isBonusEnabled: boolean;

  @ApiProperty({
    description:
      'Default downgrade grace period days / 기본 강등 유예 기간 (일)',
    example: 7,
  })
  defaultDowngradeGracePeriodDays: number;

  @ApiProperty({
    description: 'Default reward expiry days / 기본 보너스 유효 기간 (일)',
    example: 30,
  })
  defaultRewardExpiryDays: number;

  @ApiProperty({
    description: 'Amount of USD rolling required to grant 1 XP',
    example: '1.0',
  })
  expGrantRollingUsd: string;

  @ApiProperty({ description: 'Updated at / 수정 일시' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Updated by (Admin ID) / 수정자 ID',
    example: '100',
    nullable: true,
  })
  updatedBy: string | null;
}
