import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VoidWageringRequirementDto {
    @ApiProperty({ description: 'Reason for voiding the requirement', required: false })
    @IsString()
    @IsOptional()
    reason?: string;
}
