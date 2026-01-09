import { ExchangeCurrencyCode } from '@repo/database';
import { CompWallet } from 'src/modules/comp/domain';

export class CompBalanceResponseDto {
    currency: ExchangeCurrencyCode;
    balance: string;
    totalEarned: string;
    totalUsed: string;

    static fromDomain(wallet: CompWallet): CompBalanceResponseDto {
        const dto = new CompBalanceResponseDto();
        dto.currency = wallet.currency;
        dto.balance = wallet.balance.toString();
        dto.totalEarned = wallet.totalEarned.toString();
        dto.totalUsed = wallet.totalUsed.toString();
        return dto;
    }
}
