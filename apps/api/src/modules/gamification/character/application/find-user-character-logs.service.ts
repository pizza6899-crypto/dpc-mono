import { Inject, Injectable } from '@nestjs/common';
import { USER_CHARACTER_LOG_REPOSITORY_PORT } from '../ports';
import type { UserCharacterLogRepositoryPort } from '../ports';
import { UserCharacterLog } from '../domain/user-character-log.entity';
import { PaginatedData } from 'src/common/http/types/pagination.types';

@Injectable()
export class FindUserCharacterLogsService {
  constructor(
    @Inject(USER_CHARACTER_LOG_REPOSITORY_PORT)
    private readonly logRepo: UserCharacterLogRepositoryPort,
  ) { }

  /**
   * 특정 유저의 캐릭터 관련 활동 이력을 페이지네이션하여 가져옵니다.
   */
  async execute(userId: bigint, limit: number = 20, page: number = 1): Promise<PaginatedData<UserCharacterLog>> {
    const offset = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.logRepo.findByUserId(userId, limit, offset),
      this.logRepo.countByUserId(userId),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }
}
