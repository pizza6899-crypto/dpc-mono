import { Inject, Injectable } from '@nestjs/common';
import { QUEST_MASTER_REPOSITORY_TOKEN } from '../../core/ports/quest-master.repository.token';
import type { QuestMasterRepository } from '../../core/ports/quest-master.repository.port';
import { QuestMaster } from '../../core/domain/models';
import { PaginatedData } from 'src/common/http/types';
import { GetQuestsAdminQueryDto } from '../controllers/dto/request/get-quests-admin-query.dto';

@Injectable()
export class FindQuestsAdminService {
  constructor(
    @Inject(QUEST_MASTER_REPOSITORY_TOKEN)
    private readonly questMasterRepository: QuestMasterRepository,
  ) { }

  async list(query: GetQuestsAdminQueryDto): Promise<PaginatedData<QuestMaster>> {
    const { page = 1, limit = 20, id, type, isActive, keyword, sortBy, sortOrder } = query;

    const { items, total } = await this.questMasterRepository.list({
      skip: (page - 1) * limit,
      take: limit,
      id: id ? BigInt(id) : undefined,
      type,
      isActive,
      keyword,
      sortBy,
      sortOrder,
    });

    return {
      data: items,
      page,
      limit,
      total,
    };
  }
}
