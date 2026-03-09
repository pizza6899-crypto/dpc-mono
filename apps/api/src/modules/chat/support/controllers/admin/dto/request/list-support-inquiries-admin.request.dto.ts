import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { SupportStatus, SupportPriority } from '@prisma/client';

export class ListSupportInquiriesAdminRequestDto {
    @ApiPropertyOptional({ enum: SupportStatus, description: 'Support Status / 상담 상태' })
    @IsOptional()
    @IsEnum(SupportStatus)
    status?: SupportStatus;

    @ApiPropertyOptional({ enum: SupportPriority, description: 'Support Priority / 상담 우선순위' })
    @IsOptional()
    @IsEnum(SupportPriority)
    priority?: SupportPriority;

    @ApiPropertyOptional({ description: 'Category / 카테고리' })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional({ description: 'Assigned Admin ID (Encoded) / 배정된 관리자 ID' })
    @IsOptional()
    @IsString()
    adminId?: string;
}
