import { ApiProperty } from '@nestjs/swagger';
import { TierChangeType } from '@prisma/client';

export class UserTierHistoryResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    fromTierId: string | null;

    @ApiProperty()
    toTierId: string;

    @ApiProperty({ enum: TierChangeType })
    changeType: TierChangeType;

    @ApiProperty({ nullable: true })
    reason: string | null;

    @ApiProperty()
    changedAt: Date;

    @ApiProperty({ nullable: true })
    rollingAmountSnap: string;

    @ApiProperty({ nullable: true })
    depositAmountSnap: string;
}
