import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UnlockUserTierDto {
    @ApiPropertyOptional({ description: 'Reason for unlocking / 잠금 해제 사유' })
    @IsString()
    @IsOptional()
    reason?: string;
}
