import { ApiProperty } from '@nestjs/swagger';
import {
  SupportStatus,
  SupportPriority,
  SupportCategory,
} from '@prisma/client';
import { IsEnum, IsOptional, IsIn } from 'class-validator';

export class UpdateSupportInquiryAdminRequestDto {
  @ApiProperty({
    description:
      'Support status (Allowed: OPEN, IN_PROGRESS) / 상담 상태 (허용: OPEN, IN_PROGRESS)',
    enum: [SupportStatus.OPEN, SupportStatus.IN_PROGRESS],
    required: false,
  })
  @IsEnum(SupportStatus)
  @IsIn([SupportStatus.OPEN, SupportStatus.IN_PROGRESS], {
    message: 'Only OPEN or IN_PROGRESS statuses can be set via this endpoint.',
  })
  @IsOptional()
  status?: SupportStatus;

  @ApiProperty({
    description: 'Support priority / 상담 우선순위',
    enum: SupportPriority,
    required: false,
  })
  @IsEnum(SupportPriority)
  @IsOptional()
  priority?: SupportPriority;

  @ApiProperty({
    description: 'Support category / 상담 카테고리',
    enum: SupportCategory,
    required: false,
  })
  @IsEnum(SupportCategory)
  @IsOptional()
  category?: SupportCategory;
}
