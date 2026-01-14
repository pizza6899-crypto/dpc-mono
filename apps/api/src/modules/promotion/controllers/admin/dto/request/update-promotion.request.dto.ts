// src/modules/promotion/controllers/admin/dto/request/update-promotion.request.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class UpdatePromotionRequestDto {
  @ApiPropertyOptional({
    description: '관리용 프로모션 이름',
    example: '첫 충전 100% 보너스',
  })
  @IsOptional()
  @IsString()
  managementName?: string;

  @ApiPropertyOptional({
    description: '활성화 여부',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: '프로모션 코드',
    example: 'WELCOME_BONUS',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: '프로모션 시작일',
    example: '2024-01-01T00:00:00Z',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional({
    description: '프로모션 종료일',
    example: '2024-12-31T23:59:59Z',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @ApiPropertyOptional({
    description: '보너스 비율',
    example: '1.0',
    type: String,
  })
  @IsOptional()
  @IsString()
  bonusRate?: string;

  @ApiPropertyOptional({
    description: '롤링 배수',
    example: '20.0',
    type: String,
  })
  @IsOptional()
  @IsString()
  rollingMultiplier?: string;

  @ApiPropertyOptional({
    description: '1회성 프로모션 여부',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isOneTime?: boolean;
}

