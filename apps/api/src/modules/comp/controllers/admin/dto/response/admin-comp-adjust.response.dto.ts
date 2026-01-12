import { ApiProperty } from '@nestjs/swagger';

export class AdminCompAdjustResponseDto {


    @ApiProperty({ description: 'New comp balance after adjustment', example: '1500.00' })
    newBalance: string;
}
