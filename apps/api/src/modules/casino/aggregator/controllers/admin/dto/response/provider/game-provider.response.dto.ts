import { ApiProperty } from '@nestjs/swagger';

export class GameProviderResponseDto {
    @ApiProperty({ type: String, description: 'Provider ID / 프로바이더 ID' })
    id: string;

    @ApiProperty({ type: String, description: 'Aggregator ID / 어그리게이터 ID' })
    aggregatorId: string;

    @ApiProperty({ description: 'External Provider ID / 외부 프로바이더 ID (API 호출용)' })
    externalId: string;

    @ApiProperty({ description: 'Provider name / 게임사 이름' })
    name: string;

    @ApiProperty({ description: 'Provider identification code / 게임사 식별 코드' })
    code: string;

    @ApiProperty({ description: 'Brand group code / 브랜드 그룹 코드' })
    groupCode: string;

    @ApiProperty({ description: 'Logo image URL / 로고 이미지 URL', nullable: true })
    imageUrl: string | null;

    @ApiProperty({ description: 'Is active / 활성 여부' })
    isActive: boolean;

    @ApiProperty({ description: 'Created date / 생성일' })
    createdAt: Date;

    @ApiProperty({ description: 'Updated date / 수정일' })
    updatedAt: Date;
}
