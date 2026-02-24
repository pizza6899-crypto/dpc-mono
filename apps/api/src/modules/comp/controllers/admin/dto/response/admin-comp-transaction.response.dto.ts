import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompTransactionType } from '@prisma/client';

export class AdminCompTransactionResponseDto {
    @ApiProperty({
        description: 'Transaction ID / 거래 ID',
        example: '123456789',
    })
    id: string;

    @ApiProperty({
        description: 'Comp Wallet ID / 콤프 지갑 ID',
        example: '123',
    })
    compWalletId: string;

    @ApiProperty({ description: 'Amount / 금액' })
    amount: string;

    @ApiProperty({ description: 'Balance Before / 변경 전 잔액' })
    balanceBefore: string;

    @ApiProperty({ description: 'Balance After / 변경 후 잔액' })
    balanceAfter: string;

    @ApiProperty({
        enum: CompTransactionType,
        description: 'Transaction Type / 거래 유형',
    })
    type: CompTransactionType;

    @ApiPropertyOptional({
        description: 'Reference ID (e.g. Game Round ID) / 참조 ID',
    })
    referenceId?: string;

    @ApiPropertyOptional({ description: 'Description / 설명' })
    description?: string;

    @ApiProperty({ description: 'Created At / 생성일' })
    createdAt: Date;
}
