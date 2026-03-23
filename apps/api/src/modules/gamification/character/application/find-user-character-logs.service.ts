import { Inject, Injectable } from '@nestjs/common';
import { USER_CHARACTER_LOG_REPOSITORY_PORT } from '../ports';
import type { UserCharacterLogRepositoryPort } from '../ports';
import { UserCharacterLog } from '../domain/user-character-log.entity';

@Injectable()
export class FindUserCharacterLogsService {
  constructor(
    @Inject(USER_CHARACTER_LOG_REPOSITORY_PORT)
    private readonly logRepo: UserCharacterLogRepositoryPort,
  ) { }

  /**
   * 특정 유저의 캐릭터 관련 활동 이력을 가져옵니다.
   */
  async execute(userId: bigint, limit: number = 20, offset: number = 0): Promise<UserCharacterLog[]> {
    return this.logRepo.findByUserId(userId, limit, offset);
  }
}
