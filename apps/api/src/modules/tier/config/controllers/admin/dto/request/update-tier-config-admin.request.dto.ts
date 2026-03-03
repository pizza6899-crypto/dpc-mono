import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateTierConfigAdminRequestDto {
  @ApiProperty({
    description: 'Enable/Disable upgrade / 승급 활성화 여부',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isUpgradeEnabled?: boolean;

  @ApiProperty({
    description: 'Enable/Disable downgrade / 강등 활성화 여부',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isDowngradeEnabled?: boolean;

  @ApiProperty({
    description: 'Enable bonus / 보너스 활성화 여부',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isBonusEnabled?: boolean;

  @ApiProperty({
    description:
      'Default downgrade grace period days / 기본 강등 유예 기간 (일)',
    example: 7,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  defaultDowngradeGracePeriodDays?: number;

  @ApiProperty({
    description: 'Default reward expiry days / 기본 보너스 유효 기간 (일)',
    example: 30,
    required: false,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  defaultRewardExpiryDays?: number;

  @ApiProperty({
    description: 'Required rolling amount (USD) to grant 1 XP / 1 XP를 얻기 위해 필요한 롤링 금액 (USD)',
    example: 10,
    required: false,
  })
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  expGrantRollingUsd?: number;
}
