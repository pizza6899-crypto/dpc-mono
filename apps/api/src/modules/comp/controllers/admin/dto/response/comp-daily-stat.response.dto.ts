import { ApiProperty } from '@nestjs/swagger';

export class CompDailyStatResponseDto {
    @ApiProperty({ description: 'Date of stats', example: '2024-01-01' })
    date: string;

    @ApiProperty({ description: 'Total points earned on this day', example: '1000.00' })
    earned: string;

    @ApiProperty({ description: 'Total points used on this day', example: '500.00' })
    used: string;
}
