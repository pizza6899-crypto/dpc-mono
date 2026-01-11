import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DecodeSqidResponseDto {
    @ApiProperty({
        description: '디코딩된 원본 ID',
        example: '12345',
    })
    decodedId: string;

    @ApiProperty({
        description: '입력된 Sqid 문자열',
        example: 'u_abc123xyz',
    })
    originalSqid: string;

    @ApiPropertyOptional({
        description: '감지된 접두사 (자동 감지됨)',
        example: 'u',
        nullable: true,
    })
    detectedPrefix: string | null;

    @ApiPropertyOptional({
        description: '접두사 타입 설명',
        example: 'USER',
        nullable: true,
    })
    prefixType: string | null;
}
