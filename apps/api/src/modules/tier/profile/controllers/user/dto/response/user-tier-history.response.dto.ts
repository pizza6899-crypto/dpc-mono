import { ApiProperty } from '@nestjs/swagger';
import { TierChangeType } from '@prisma/client';

export class UserTierHistoryResponseDto {
    @ApiProperty({ description: 'History ID / 이력 ID' })
    id: string;

    @ApiProperty({ nullable: true, description: 'Previous tier ID / 변경 전 티어 ID' })
    fromTierId: string | null;

    @ApiProperty({ description: 'New tier ID / 변경 후 티어 ID' })
    toTierId: string;

    @ApiProperty({ enum: TierChangeType, description: 'Change type / 변경 유형' })
    changeType: TierChangeType;

    @ApiProperty({ description: 'Date of change / 변경 일시' })
    changedAt: Date;
}
