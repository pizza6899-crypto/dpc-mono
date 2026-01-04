import { ApiProperty } from '@nestjs/swagger';
import { TierHistory, TierChangeType } from '../../../../domain/model/tier-history.entity';

export class TierHistoryResponseDto {
    @ApiProperty({ description: 'History ID / 히스토리 ID', example: '1' })
    id: string;

    @ApiProperty({ description: 'User ID / 사용자 ID', example: '1' })
    userId: string;

    @ApiProperty({ description: 'Previous Tier ID / 이전 티어 ID', required: false, example: '1' })
    fromTierId?: string;

    @ApiProperty({ description: 'Target Tier ID / 대상 티어 ID', example: '2' })
    toTierId: string;

    @ApiProperty({ enum: TierChangeType, description: 'Change type / 변경 유형', example: TierChangeType.PROMOTION })
    changeType: TierChangeType;

    @ApiProperty({ description: 'Reason for change / 변경 사유', example: 'Auto Promotion' })
    reason: string;

    @ApiProperty({ description: 'Rolling amount at the time of change / 변경 시점의 롤링 금액', example: '1000.00' })
    rollingSnapshot: string;

    @ApiProperty({ description: 'Bonus amount awarded / 지급된 보너스 금액', example: '50.00' })
    bonusAmount: string;

    @ApiProperty({ description: 'Time of change / 변경 일시' })
    createdAt: Date;

    constructor(history: TierHistory) {
        this.id = history.id?.toString() ?? '';
        this.userId = history.userId.toString();
        this.fromTierId = history.fromTierId?.toString();
        this.toTierId = history.toTierId.toString();
        this.changeType = history.changeType;
        this.reason = history.reason;
        this.rollingSnapshot = history.rollingSnapshot.toString();
        this.bonusAmount = history.bonusAmount.toString();
        this.createdAt = history.createdAt;
    }
}
