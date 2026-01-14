// src/modules/promotion/controllers/admin/dto/response/promotion-admin.response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromotionStatisticsResponseDto } from './promotion-statistics.response.dto';

export class PromotionAdminResponseDto {
  @ApiProperty({
    description: '프로모션 ID',
    example: '1',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: '관리용 프로모션 이름',
    example: '첫 충전 100% 보너스',
  })
  managementName: string;

  @ApiProperty({
    description: '프로모션 코드',
    example: 'WELCOME_BONUS',
  })
  code: string;

  @ApiProperty({
    description: '활성화 여부',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: '프로모션 타겟 타입',
    example: 'NEW_USER_FIRST_DEPOSIT',
  })
  targetType: string;

  @ApiProperty({
    description: '보너스 타입',
    example: 'PERCENTAGE',
  })
  bonusType: string;

  @ApiPropertyOptional({
    description: '보너스 비율',
    example: '1.0',
    type: String,
  })
  bonusRate?: string;

  @ApiPropertyOptional({
    description: '롤링 배수',
    example: '20.0',
    type: String,
  })
  rollingMultiplier?: string;

  @ApiProperty({
    description: '1회성 프로모션 여부',
    example: true,
  })
  isOneTime: boolean;

  @ApiProperty({
    description: '입금 필수 여부',
    example: true,
  })
  isDepositRequired: boolean;

  @ApiPropertyOptional({
    description: '최대 사용 횟수',
    example: 100,
    type: Number,
    nullable: true,
  })
  maxUsageCount: number | null;

  @ApiProperty({
    description: '현재 사용 횟수',
    example: 10,
    type: Number,
  })
  currentUsageCount: number;

  @ApiPropertyOptional({
    description: '보너스 만료 분',
    example: 1440,
    type: Number,
    nullable: true,
  })
  bonusExpiryMinutes: number | null;

  @ApiProperty({
    description: '관리자 메모',
    example: ['VIP Only'],
    type: [String],
  })
  note: string[];

  @ApiProperty({
    description: '자격 유지 조건',
    example: 'FORFEIT_BONUS_ON_WITHDRAWAL',
  })
  qualificationMaintainCondition: string;

  @ApiPropertyOptional({
    description: '프로모션 시작일',
    example: '2024-01-01T00:00:00Z',
    nullable: true,
  })
  startDate: Date | null;

  @ApiPropertyOptional({
    description: '프로모션 종료일',
    example: '2024-12-31T23:59:59Z',
    nullable: true,
  })
  endDate: Date | null;

  @ApiProperty({
    description: '생성일시',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일시',
    example: '2024-01-01T00:00:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: '프로모션 통계',
    type: PromotionStatisticsResponseDto,
  })
  statistics?: PromotionStatisticsResponseDto;
}

