// src/modules/deposit/ports/out/index.ts
export * from './deposit-detail.repository.port';
export * from './bank-config.repository.port';
export * from './crypto-config.repository.port';

export const DEPOSIT_DETAIL_REPOSITORY = Symbol('DEPOSIT_DETAIL_REPOSITORY');
export const BANK_CONFIG_REPOSITORY = Symbol('BANK_CONFIG_REPOSITORY');
export const CRYPTO_CONFIG_REPOSITORY = Symbol('CRYPTO_CONFIG_REPOSITORY');
