import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import {
  SupportStatus,
  SupportPriority,
  SupportCategory,
} from '@prisma/client';

export class ListSupportInquiriesAdminRequestDto {
  @ApiPropertyOptional({
    enum: SupportStatus,
    description: 'Support Status / 상담 상태',
  })
  @IsOptional()
  @IsEnum(SupportStatus)
  status?: SupportStatus;

  @ApiPropertyOptional({ description: 'Specific Room ID / 특정 상담방 ID' })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiPropertyOptional({
    enum: SupportPriority,
    description: 'Support Priority / 상담 우선순위',
  })
  @IsOptional()
  @IsEnum(SupportPriority)
  priority?: SupportPriority;

  @ApiPropertyOptional({
    enum: SupportCategory,
    description: 'Category / 카테고리',
  })
  @IsOptional()
  @IsEnum(SupportCategory)
  category?: SupportCategory;

  @ApiPropertyOptional({ description: 'Assigned Admin ID / 배정된 관리자 ID' })
  @IsOptional()
  @IsString()
  adminId?: string;
}
