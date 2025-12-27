// src/modules/affiliate/referral/controllers/dto/response/admin-referral-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class AdminReferralListItemDto {
  @ApiProperty({ description: '레퍼럴 ID' })
  id: string;

  @ApiProperty({ description: '어플리에이트 사용자 ID' })
  affiliateId: string;

  @ApiProperty({ description: '어플리에이트 이메일', nullable: true })
  affiliateEmail: string | null;

  @ApiProperty({ description: '어플리에이트 숫자 ID' })
  affiliateNumericId: number;

  @ApiProperty({ description: '피추천인 사용자 ID' })
  subUserId: string;

  @ApiProperty({ description: '피추천인 이메일', nullable: true })
  subUserEmail: string | null;

  @ApiProperty({ description: '피추천인 숫자 ID' })
  subUserNumericId: number;

  @ApiProperty({ description: '레퍼럴 코드 ID' })
  codeId: string;

  @ApiProperty({ description: '레퍼럴 코드' })
  code: string;

  @ApiProperty({ description: '캠페인 이름', nullable: true })
  campaignName: string | null;

  @ApiProperty({ description: 'IP 주소', nullable: true })
  ipAddress: string | null;

  @ApiProperty({ description: '디바이스 핑거프린트', nullable: true })
  deviceFingerprint: string | null;

  @ApiProperty({ description: 'User-Agent', nullable: true })
  userAgent: string | null;

  @ApiProperty({ description: '생성일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시' })
  updatedAt: Date;
}
