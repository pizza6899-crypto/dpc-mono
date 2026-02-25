import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompTransactionType, Prisma } from '@prisma/client';

export class AdminCompTransactionResponseDto {
    @ApiProperty({
        description: 'Transaction ID / 거래 ID',
        example: '123456789',
    })
    id: string;

    @ApiProperty({
        description: 'Comp Account ID / 콤프 계정 ID',
        example: '123',
    })
    compAccountId: string;

    @ApiProperty({ description: 'Amount / 금액' })
    amount: string;

    @ApiPropertyOptional({ description: 'Applied Rate / 적용 비율' })
    appliedRate?: string;

    @ApiProperty({
        enum: CompTransactionType,
        description: 'Transaction Type / 거래 유형',
    })
    type: CompTransactionType;

    @ApiPropertyOptional({
        description: 'Reference ID (e.g. Game Round ID) / 참조 ID',
    })
    referenceId?: string;

    @ApiPropertyOptional({
        description: 'Parent Transaction ID / 상위 거래 ID',
    })
    parentTransactionId?: string;

    @ApiPropertyOptional({
        description: 'Processed By Admin User ID / 관리자 ID',
    })
    processedBy?: string;

    @ApiPropertyOptional({ description: 'Metadata / 메타데이터', type: Object })
    metadata?: any;

    @ApiPropertyOptional({ description: 'Description / 설명' })
    description?: string;

    @ApiProperty({ description: 'Created At / 생성일' })
    createdAt: Date;
}
