import { ApiProperty } from '@nestjs/swagger';
import { SupportStatus, SupportPriority, SupportCategory } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateSupportInquiryAdminRequestDto {
    @ApiProperty({ enum: SupportStatus, required: false })
    @IsEnum(SupportStatus)
    @IsOptional()
    status?: SupportStatus;

    @ApiProperty({ enum: SupportPriority, required: false })
    @IsEnum(SupportPriority)
    @IsOptional()
    priority?: SupportPriority;

    @ApiProperty({ enum: SupportCategory, required: false })
    @IsEnum(SupportCategory)
    @IsOptional()
    category?: SupportCategory;
}
