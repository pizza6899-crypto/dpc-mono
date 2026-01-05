import { ApiProperty } from '@nestjs/swagger';

export class SyncMissingUsersResponseDto {
    @ApiProperty({ description: 'Number of users processed / 처리된 사용자 수', example: 10 })
    processedCount: number;

    constructor(partial: Partial<SyncMissingUsersResponseDto>) {
        Object.assign(this, partial);
    }
}
