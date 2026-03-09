import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { SupportCategory } from '@prisma/client';

export class StartSupportInquiryUserRequestDto {
    @ApiPropertyOptional({
        description: 'Support Category / 상담 카테고리',
        enum: SupportCategory,
    })
    @IsOptional()
    @IsEnum(SupportCategory)
    category?: SupportCategory;
}
