import { Inject, Injectable } from '@nestjs/common';
import { ExchangeCurrencyCode } from '@prisma/client';
import { COMP_CONFIG_REPOSITORY } from '../ports/repository.token';
import type { CompConfigRepositoryPort } from '../ports';
import { CompConfig } from '../domain';

@Injectable()
export class FindCompConfigService {
  constructor(
    @Inject(COMP_CONFIG_REPOSITORY)
    private readonly compConfigRepository: CompConfigRepositoryPort,
  ) {}

  async execute(currency: ExchangeCurrencyCode): Promise<CompConfig | null> {
    return await this.compConfigRepository.getConfig(currency);
  }

  async findAll(): Promise<CompConfig[]> {
    return await this.compConfigRepository.getAllConfigs();
  }
}
