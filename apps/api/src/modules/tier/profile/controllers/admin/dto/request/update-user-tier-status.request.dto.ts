import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserTierStatus } from '@prisma/client';

export class UpdateUserTierStatusRequestDto {
    @ApiProperty({ enum: UserTierStatus, description: 'New status for the user tier / 변경할 티어 상태' })
    @IsEnum(UserTierStatus)
    status: UserTierStatus;

    @ApiProperty({ nullable: true, description: 'Reason for status update / 상태 변경 사유' })
    @IsOptional()
    @IsString()
    reason?: string;
}
