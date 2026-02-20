import { Inject, Injectable } from '@nestjs/common';
import { CasinoGameProvider } from '../../domain';
import { CASINO_GAME_PROVIDER_REPOSITORY } from '../../ports/casino-game-provider.repository.token';
import { type CasinoGameProviderRepositoryPort } from '../../ports/casino-game-provider.repository.port';

interface CreateGameProviderParams {
  aggregatorId: bigint;
  externalId: string;
  name: string;
  code: string;
  groupCode?: string;
  imageUrl?: string;
  isActive?: boolean;
}

@Injectable()
export class CreateGameProviderService {
  constructor(
    @Inject(CASINO_GAME_PROVIDER_REPOSITORY)
    private readonly repository: CasinoGameProviderRepositoryPort,
  ) {}

  async execute(params: CreateGameProviderParams): Promise<CasinoGameProvider> {
    // 이미 존재하는지 확인 (Optional - Repository 레벨에서 Unique 제약 조건 에러가 발생할 수 있음)
    // 비즈니스 로직상 체크하고 싶다면:
    // const existing = await this.repository.findByCode(params.aggregatorId, params.code);
    // if (existing) return existing;

    const provider = CasinoGameProvider.create({
      aggregatorId: params.aggregatorId,
      externalId: params.externalId,
      name: params.name,
      code: params.code,
      groupCode: params.groupCode ?? params.code, // 기본값: code와 동일
      imageUrl: params.imageUrl,
      isActive: params.isActive,
    });

    return await this.repository.create(provider);
  }
}
