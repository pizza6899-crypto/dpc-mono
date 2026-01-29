import { ApiProperty } from '@nestjs/swagger';
import { CompTransactionType } from '@prisma/client';

export class CompTransactionResponseDto {
    @ApiProperty({ description: 'Transaction ID (Encoded) / 거래 ID (인코딩됨)', example: 'ctx_abc123' })
    id: string;

    @ApiProperty({ description: 'Comp Wallet ID (Encoded) / 콤프 지갑 ID (인코딩됨)', example: 'cw_abc123' })
    compWalletId: string;

    @ApiProperty({ description: 'Amount / 금액' })
    amount: string;

    @ApiProperty({ description: 'Balance Before / 변경 전 잔액' })
    balanceBefore: string;

    @ApiProperty({ description: 'Balance After / 변경 후 잔액' })
    balanceAfter: string;

    @ApiProperty({ enum: CompTransactionType, description: 'Transaction Type / 거래 유형' })
    type: CompTransactionType;

    @ApiProperty({ description: 'Created At / 생성일' })
    createdAt: Date;
}
