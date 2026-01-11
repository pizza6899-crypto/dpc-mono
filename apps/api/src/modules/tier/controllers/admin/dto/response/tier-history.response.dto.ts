import { ApiProperty } from '@nestjs/swagger';

export class TierHistoryResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    userId: string;

    @ApiProperty()
    userEmail: string;

    @ApiProperty({ nullable: true })
    oldTierCode: string | null;

    @ApiProperty()
    newTierCode: string;

    @ApiProperty()
    changeType: string;

    @ApiProperty({ nullable: true })
    reason: string | null;

    @ApiProperty()
    createdAt: Date;
}

export class TierHistoryListResponseDto {
    @ApiProperty({ type: [TierHistoryResponseDto] })
    items: TierHistoryResponseDto[];

    @ApiProperty()
    total: number;

    @ApiProperty()
    page: number;

    @ApiProperty()
    limit: number;
}
