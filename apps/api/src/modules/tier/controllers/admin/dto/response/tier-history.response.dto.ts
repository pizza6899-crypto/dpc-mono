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

    constructor(history: any) {
        this.id = history.id.toString();
        this.userId = history.userId;
        this.userEmail = history.userEmail;
        this.oldTierCode = history.oldTierCode;
        this.newTierCode = history.newTierCode;
        this.changeType = history.changeType;
        this.reason = history.reason;
        this.createdAt = history.createdAt;
    }
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
