import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExchangeCurrencyCode, CompTransactionType } from '@repo/database';
import { CompWalletTransaction } from '@repo/database';
import { CompTransaction } from 'src/modules/comp/domain';

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

    static fromDomain(entity: CompTransaction): CompTransactionResponseDto {
        const dto = new CompTransactionResponseDto();
        dto.id = entity.id.toString();
        dto.compWalletId = entity.compWalletId.toString();
        dto.amount = entity.amount.toString();
        dto.balanceAfter = entity.balanceAfter.toString();
        dto.type = entity.type;
        dto.referenceId = entity.referenceId ?? undefined;
        dto.description = entity.description ?? undefined;
        dto.createdAt = entity.createdAt;
        return dto;
    }
}
