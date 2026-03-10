import { ApiProperty } from '@nestjs/swagger';
import { SupportStatus, SupportPriority, SupportCategory } from '@prisma/client';

export class UpdateSupportInquiryAdminResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    sid: string;

    @ApiProperty({ enum: SupportStatus })
    status: SupportStatus;

    @ApiProperty({ enum: SupportPriority })
    priority: SupportPriority;

    @ApiProperty({ enum: SupportCategory, nullable: true })
    category: SupportCategory | null;

    @ApiProperty()
    updatedAt: Date;
}
