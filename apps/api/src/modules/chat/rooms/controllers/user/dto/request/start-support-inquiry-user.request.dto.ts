import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { SupportPriority } from '@prisma/client';

export class StartSupportInquiryUserRequestDto {
    @ApiPropertyOptional({ description: '상담 카테고리 (계정, 입금, 게임 등)' })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional({ description: '상담 제목/내용 요약' })
    @IsOptional()
    @IsString()
    subject?: string;

    @ApiPropertyOptional({
        description: '우선순위',
        enum: SupportPriority,
        default: SupportPriority.NORMAL
    })
    @IsOptional()
    @IsEnum(SupportPriority)
    priority?: SupportPriority;
}
