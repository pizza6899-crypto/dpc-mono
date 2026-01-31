import { ApiProperty } from '@nestjs/swagger';

export class TierConfigAdminResponseDto {
    @ApiProperty({ description: 'Enable promotion / 승급 활성화 여부', example: true })
    isPromotionEnabled: boolean;

    @ApiProperty({ description: 'Enable downgrade / 강등 활성화 여부', example: false })
    isDowngradeEnabled: boolean;

    @ApiProperty({ description: 'Evaluation hour (UTC) / 배치 심사 시간 (UTC)', example: 0 })
    evaluationHourUtc: number;

    @ApiProperty({ description: 'Updated at / 수정 일시' })
    updatedAt: Date;

    @ApiProperty({ description: 'Updated by (Admin ID) / 수정자 ID', example: '100', nullable: true })
    updatedBy: string | null;
}
