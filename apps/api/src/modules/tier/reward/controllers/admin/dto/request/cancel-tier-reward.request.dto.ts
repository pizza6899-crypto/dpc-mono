import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelTierRewardRequestDto {
    @ApiProperty({ description: 'Reason for cancellation / 취소 사유', example: 'Admin cancelled due to error' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    reason: string;
}
