import { ApiProperty } from '@nestjs/swagger';

export class TierConfigAdminResponseDto {
    @ApiProperty({ description: 'Enable promotion / 승급 활성화 여부', example: true })
    isPromotionEnabled: boolean;

    @ApiProperty({ description: 'Enable downgrade / 강등 활성화 여부', example: false })
    isDowngradeEnabled: boolean;

    @ApiProperty({ description: 'Enable bonus / 보너스 활성화 여부', example: true })
    isBonusEnabled: boolean;

    @ApiProperty({ description: 'Default grace period days / 기본 강등 유예 기간 (일)', example: 7 })
    defaultGracePeriodDays: number;

    @ApiProperty({ description: 'Trigger interval minutes / 심사 트리거 주기 (분)', example: 60 })
    triggerIntervalMinutes: number;

    @ApiProperty({ description: 'Updated at / 수정 일시' })
    updatedAt: Date;

    @ApiProperty({ description: 'Updated by (Admin ID) / 수정자 ID', example: '100', nullable: true })
    updatedBy: string | null;
}
