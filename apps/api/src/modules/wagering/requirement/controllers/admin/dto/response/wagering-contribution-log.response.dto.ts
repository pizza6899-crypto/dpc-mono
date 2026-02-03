import { ApiProperty } from '@nestjs/swagger';

export class WageringContributionLogResponseDto {
    @ApiProperty({ description: 'ID', example: '123456789' })
    id: string;

    @ApiProperty({ description: 'Wagering Requirement ID', example: '111222333' })
    wageringRequirementId: string;

    @ApiProperty({ description: 'Game Round ID', example: '999888777' })
    gameRoundId: string;

    @ApiProperty({ description: 'Requested Bet Amount / 배팅 원금', example: '1000' })
    requestAmount: string;

    @ApiProperty({ description: 'Contribution Rate / 기여율', example: '1.0' })
    contributionRate: string;

    @ApiProperty({ description: 'Contributed Amount / 실제 기여액', example: '1000' })
    contributedAmount: string;

    @ApiProperty({ description: 'Created At / 생성일' })
    createdAt: Date;
}
