import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ForbiddenWordAdminResponseDto {
    @ApiProperty({ description: 'ID / 식별자', example: '112938475' })
    id: string;

    @ApiProperty({ description: 'Forbidden word / 금지어', example: 'badword' })
    word: string;

    @ApiPropertyOptional({ description: 'Description / 설명', example: 'AI detected' })
    description: string | null;

    @ApiProperty({ description: 'Active status / 활성화 여부', example: true })
    isActive: boolean;

    @ApiProperty({ description: 'Creation date / 생성일' })
    createdAt: Date;

    @ApiProperty({ description: 'Last update date / 최종 수정일' })
    updatedAt: Date;
}
