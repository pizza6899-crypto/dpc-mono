// src/modules/affiliate/referral/controllers/dto/request/get-referrals-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { createPaginationQueryDto } from 'src/platform/http/types/pagination.types';

type ReferralSortFields = 'createdAt' | 'updatedAt';

export class GetReferralsQueryDto extends createPaginationQueryDto<ReferralSortFields>(
  {
    defaultLimit: 20,
    maxLimit: 100,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  },
  ['createdAt', 'updatedAt'],
) {
  @ApiPropertyOptional({
    description: '어플리에이트 사용자 ID 필터',
  })
  @IsOptional()
  @IsString()
  affiliateId?: string;

  @ApiPropertyOptional({
    description: '피추천인 사용자 ID 필터',
  })
  @IsOptional()
  @IsString()
  subUserId?: string;

  @ApiPropertyOptional({
    description: '레퍼럴 코드 ID 필터',
  })
  @IsOptional()
  @IsString()
  codeId?: string;

  @ApiPropertyOptional({
    description: '시작 날짜 (ISO 8601 형식)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: '종료 날짜 (ISO 8601 형식)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
