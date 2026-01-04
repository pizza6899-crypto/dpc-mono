import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForceUpdateUserTierDto {
    @ApiProperty({ description: 'Target Tier Code / 대상 티어 코드', example: 'DIAMOND' })
    @IsString()
    @IsNotEmpty()
    tierCode: string;

    @ApiProperty({ description: 'Reason for change / 변경 사유', required: false, example: 'Admin promotion' })
    @IsOptional()
    @IsString()
    reason?: string;
}
