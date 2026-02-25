import { ApiProperty } from '@nestjs/swagger';
import { CompTransactionType } from '@prisma/client';

export class UserCompTransactionResponseDto {
    @ApiProperty({
        description: 'Transaction ID (Encoded) / 거래 ID (인코딩됨)',
        example: 'ctx_abc123',
    })
    id: string;

    @ApiProperty({
        description: 'Comp Account ID (Encoded) / 콤프 계정 ID (인코딩됨)',
        example: 'ca_abc123',
    })
    compAccountId: string;

    @ApiProperty({ description: 'Amount / 금액' })
    amount: string;

    @ApiProperty({
        enum: CompTransactionType,
        description: 'Transaction Type / 거래 유형',
    })
    type: CompTransactionType;

    @ApiProperty({ description: 'Description / 설명', nullable: true })
    description: string | null;

    @ApiProperty({ description: 'Created At / 생성일' })
    createdAt: Date;
}
