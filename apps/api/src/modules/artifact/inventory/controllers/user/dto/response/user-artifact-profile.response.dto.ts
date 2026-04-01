import { ApiProperty } from '@nestjs/swagger';
import { ArtifactGrade } from '@prisma/client';

/**
 * [Artifact Inventory] 유물 장착 효과 합계 요약 DTO
 */
export class UserArtifactEffectSummaryDto {
  @ApiProperty({ description: 'Casino Benefit Total / 카지노 혜택 합계', example: 150 })
  casinoBenefit: number;

  @ApiProperty({ description: 'Slot Benefit Total / 슬롯 혜택 합계', example: 200 })
  slotBenefit: number;

  @ApiProperty({ description: 'Sports Benefit Total / 스포츠 혜택 합계', example: 100 })
  sportsBenefit: number;

  @ApiProperty({ description: 'Minigame Benefit Total / 미니게임 혜택 합계', example: 50 })
  minigameBenefit: number;

  @ApiProperty({ description: 'Bad Beat Benefit Total / 배드비트 혜택 합계', example: 300 })
  badBeatBenefit: number;

  @ApiProperty({ description: 'Critical Benefit Total / 크리티컬 혜택 합계', example: 500 })
  criticalBenefit: number;
}

/**
 * [Artifact Inventory] 슬롯별 유물 장착 정보 DTO (Flattened)
 */
export class UserArtifactSlotResponseDto {
  @ApiProperty({
    description: 'Slot Number / 슬롯 번호',
    example: 1,
  })
  slotNo: number;

  @ApiProperty({
    description: 'Is Equipped / 해당 슬롯에 유물이 장착되어 있는지 여부',
    example: false,
  })
  isEquipped: boolean;

  @ApiProperty({
    description: 'User Artifact ID (Sqid) / 유저 유물 식별자',
    example: 'uar_sqid_1',
    nullable: true,
  })
  id: string | null;

  @ApiProperty({
    description: 'Artifact Catalog Code / 유물 코드',
    example: 'ART_HEAL_01',
    nullable: true,
  })
  artifactCode: string | null;

  @ApiProperty({
    description: 'Artifact Grade / 유물 등급',
    enum: ArtifactGrade,
    example: ArtifactGrade.COMMON,
    nullable: true,
  })
  grade: ArtifactGrade | null;

  @ApiProperty({
    description: 'Acquired Date / 획득 일시',
    example: '2024-03-27T10:00:00Z',
    nullable: true,
  })
  acquiredAt: Date | null;
}

/**
 * [Artifact Inventory] 보유 유물 티켓 수량 정보 DTO
 */
export class UserArtifactTicketResponseDto {
  @ApiProperty({ description: 'Total All Tickets (No Grade Limit) / 등급 무관 전체 티켓 수', example: 10 })
  all: number;

  @ApiProperty({ description: 'Common Tickets / 일반 확급권', example: 5 })
  COMMON: number;

  @ApiProperty({ description: 'Uncommon Tickets / 고급 확급권', example: 3 })
  UNCOMMON: number;

  @ApiProperty({ description: 'Rare Tickets / 희귀 확급권', example: 2 })
  RARE: number;

  @ApiProperty({ description: 'Epic Tickets / 영웅 확급권', example: 1 })
  EPIC: number;

  @ApiProperty({ description: 'Legendary Tickets / 전설 확급권', example: 0 })
  LEGENDARY: number;

  @ApiProperty({ description: 'Mythic Tickets / 신화 확급권', example: 0 })
  MYTHIC: number;

  @ApiProperty({ description: 'Unique Tickets / 유일 확급권', example: 0 })
  UNIQUE: number;
}

/**
 * [Artifact Inventory] 유저 유물 시스템 통합 프로필 응답 DTO (최소 정보 버전)
 */
export class UserArtifactProfileResponseDto {
  @ApiProperty({
    description: 'Number of Active Slots / 현재 활성화된 장착 슬롯 개수',
    example: 3,
  })
  activeSlotCount: number;

  @ApiProperty({
    description: 'Slot-wise Equipment Status / 슬롯별 장착 상태 및 정보',
    type: [UserArtifactSlotResponseDto],
    isArray: true,
  })
  slots: UserArtifactSlotResponseDto[];

  @ApiProperty({
    description: 'Total Equipped Effect Summary / 현재 장착된 유물 효과 합계 요약',
    type: UserArtifactEffectSummaryDto,
  })
  effects: UserArtifactEffectSummaryDto;

  @ApiProperty({
    description: 'Available Tickets Info / 보유 티켓 정보',
    type: UserArtifactTicketResponseDto,
  })
  tickets: UserArtifactTicketResponseDto;
}
