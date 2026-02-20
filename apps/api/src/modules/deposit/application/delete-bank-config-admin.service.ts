// src/modules/deposit/application/delete-bank-config-admin.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { BANK_CONFIG_REPOSITORY } from '../ports/out';
import type { BankConfigRepositoryPort } from '../ports/out';

interface DeleteBankConfigAdminParams {
  id: bigint;
}

@Injectable()
export class DeleteBankConfigAdminService {
  constructor(
    @Inject(BANK_CONFIG_REPOSITORY)
    private readonly repository: BankConfigRepositoryPort,
  ) {}

  async execute({ id }: DeleteBankConfigAdminParams): Promise<void> {
    // 존재 확인
    await this.repository.getById(id);

    // 삭제 수행
    await this.repository.delete(id);
  }
}
