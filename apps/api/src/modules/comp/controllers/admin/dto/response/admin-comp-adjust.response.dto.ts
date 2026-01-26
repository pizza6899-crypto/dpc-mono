import { ApiProperty } from '@nestjs/swagger';

export class AdminCompAdjustResponseDto {
    @ApiProperty({ description: 'New comp balance after adjustment / 조정 후 새로운 콤프 잔액', example: '1500.00' })
    newBalance: string;
}
