import { ApiProperty } from '@nestjs/swagger';

export class TierUserCountResponseDto {
    @ApiProperty({ description: 'Tier Code / 티어 코드', example: 'BRONZE' })
    tierCode: string;

    @ApiProperty({ description: 'Tier ID / 티어 ID', example: '123' })
    tierId: string;

    @ApiProperty({ description: 'User count / 사용자 수', example: 150 })
    count: number;
}
