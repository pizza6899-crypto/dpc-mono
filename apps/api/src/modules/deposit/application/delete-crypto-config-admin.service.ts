// src/modules/deposit/application/delete-crypto-config-admin.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { CRYPTO_CONFIG_REPOSITORY } from '../ports/out';
import type { CryptoConfigRepositoryPort } from '../ports/out';

interface DeleteCryptoConfigAdminParams {
  id: bigint;
}

@Injectable()
export class DeleteCryptoConfigAdminService {
  constructor(
    @Inject(CRYPTO_CONFIG_REPOSITORY)
    private readonly repository: CryptoConfigRepositoryPort,
  ) {}

  async execute({ id }: DeleteCryptoConfigAdminParams): Promise<void> {
    // 존재 확인
    await this.repository.getById(id);

    // 삭제 수행
    await this.repository.delete(id);
  }
}
