// src/modules/affiliate/commission/controllers/admin/dto/response/commission-rate.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@repo/database';

export class CommissionRateAdminResponseDto {
    @ApiProperty({
        description: 'Tier code / 티어 코드',
        example: 'BRONZE',
    })
    tierCode: string;

    @ApiProperty({
        description: 'Base rate / 기본 요율',
        example: '0.005',
    })
    baseRate: string;

    @ApiProperty({
        description: 'Custom rate / 수동 요율 (없으면 null)',
        example: '0.01',
        nullable: true,
    })
    customRate: string | null;

    @ApiProperty({
        description: 'Is custom rate enabled / 수동 요율 사용 여부',
        example: false,
    })
    isCustomRate: boolean;

    @ApiProperty({
        description: 'Effective rate / 실제 적용 요율',
        example: '0.005',
    })
    effectiveRate: string;
}
