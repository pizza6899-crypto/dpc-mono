// src/modules/deposit/application/get-available-deposit-methods.service.ts
import { Injectable } from '@nestjs/common';
import { ExchangeCurrencyCode } from '@prisma/client';

interface CryptoNetworkInfo {
  network: string;
  minDepositAmount: string;
}

interface CryptoGroup {
  symbol: ExchangeCurrencyCode;
  networks: CryptoNetworkInfo[];
}

interface BankGroup {
  currency: ExchangeCurrencyCode;
  minAmount: string;
}

interface GetAvailableDepositMethodsResult {
  bank: BankGroup[];
  crypto: CryptoGroup[];
}

@Injectable()
export class GetAvailableDepositMethodsService {
  constructor() { }

  async execute(): Promise<GetAvailableDepositMethodsResult> {
    // Note: Temporary empty implementation due to removal of Bank/Crypto configs.
    // Full logic will be re-implemented when a new configuration system is in place.
    return {
      bank: [],
      crypto: [],
    };
  }
}
