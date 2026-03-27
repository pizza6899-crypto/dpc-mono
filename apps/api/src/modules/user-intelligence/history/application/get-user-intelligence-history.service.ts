import { Inject, Injectable } from '@nestjs/common';
import {
  HISTORY_REPOSITORY_PORT,
  HistoryFindOptions,
} from '../ports/history-repository.port';
import type { IUserIntelligenceHistoryRepositoryPort } from '../ports/history-repository.port';
import { UserIntelligenceHistory } from '../domain/user-intelligence-history.entity';

export interface GetUserHistoryParams {
  userId: bigint;
  startDate?: Date;
  endDate?: Date;
  skip?: number;
  take?: number;
}

export interface GetUserHistoryResult {
  items: UserIntelligenceHistory[];
  total: number;
}

/**
 * [History] 특정 유저의 점수 변화 이력을 조회하는 서비스 (Query)
 */
@Injectable()
export class GetUserIntelligenceHistoryService {
  constructor(
    @Inject(HISTORY_REPOSITORY_PORT)
    private readonly historyRepo: IUserIntelligenceHistoryRepositoryPort,
  ) { }

  async execute(params: GetUserHistoryParams): Promise<GetUserHistoryResult> {
    const options: HistoryFindOptions = {
      userId: params.userId,
      startDate: params.startDate,
      endDate: params.endDate,
      skip: params.skip ?? 0,
      take: params.take ?? 20,
    };

    const [items, total] = await this.historyRepo.findAndCount(options);
    return { items, total };
  }
}
