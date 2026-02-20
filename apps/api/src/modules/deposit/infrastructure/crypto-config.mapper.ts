// src/modules/deposit/infrastructure/crypto-config.mapper.ts
import { Injectable } from '@nestjs/common';
import { CryptoDepositConfig as PrismaCryptoConfig } from '@prisma/client';
import { CryptoConfig } from '../domain';

@Injectable()
export class CryptoConfigMapper {
  toDomain(prismaCryptoConfig: PrismaCryptoConfig): CryptoConfig {
    return CryptoConfig.fromPersistence({
      id: prismaCryptoConfig.id,
      uid: prismaCryptoConfig.uid,
      symbol: prismaCryptoConfig.symbol,
      network: prismaCryptoConfig.network,
      isActive: prismaCryptoConfig.isActive,
      minDepositAmount: prismaCryptoConfig.minDepositAmount,
      depositFeeRate: prismaCryptoConfig.depositFeeRate,
      confirmations: prismaCryptoConfig.confirmations,
      contractAddress: prismaCryptoConfig.contractAddress,
      createdAt: prismaCryptoConfig.createdAt,
      updatedAt: prismaCryptoConfig.updatedAt,
    });
  }

  toPrisma(cryptoConfig: CryptoConfig): Partial<PrismaCryptoConfig> {
    const persistence = cryptoConfig.toPersistence();
    return {
      uid: persistence.uid,
      symbol: persistence.symbol,
      network: persistence.network,
      isActive: persistence.isActive,
      minDepositAmount: persistence.minDepositAmount,
      depositFeeRate: persistence.depositFeeRate,
      confirmations: persistence.confirmations,
      contractAddress: persistence.contractAddress,
    };
  }
}
