import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { SupportPriority } from '@prisma/client';

export class CreateSupportTicketRequestDto {
    @ApiProperty({ description: 'Category / 카테고리', example: 'DEPOSIT', required: false })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiProperty({ description: 'Subject / 제목', example: 'Deposit not credited', required: false })
    @IsOptional()
    @IsString()
    subject?: string;

    @ApiProperty({ description: 'Priority / 우선순위', enum: SupportPriority, required: false })
    @IsOptional()
    @IsEnum(SupportPriority)
    priority?: SupportPriority;
}
