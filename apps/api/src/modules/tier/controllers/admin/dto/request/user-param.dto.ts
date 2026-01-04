import { IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserParamDto {
    @ApiProperty({ description: 'User ID / 사용자 ID', example: '1' })
    @IsNumberString()
    userId: string;
}
