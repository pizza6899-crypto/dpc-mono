import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompTransactionType } from '@repo/database';

export class CompTransactionResponseDto {
    @ApiProperty({ description: 'Transaction ID' })
    id: string;

    @ApiProperty({ description: 'Comp Wallet ID' })
    compWalletId: string;

    @ApiProperty({ description: 'Amount' })
    amount: string;

    @ApiProperty({ description: 'Balance After' })
    balanceAfter: string;

    @ApiProperty({ enum: CompTransactionType, description: 'Transaction Type' })
    type: CompTransactionType;

    @ApiPropertyOptional({ description: 'Reference ID' })
    referenceId?: string;

    @ApiPropertyOptional({ description: 'Description' })
    description?: string;

    @ApiProperty({ description: 'Created At' })
    createdAt: Date;
}
