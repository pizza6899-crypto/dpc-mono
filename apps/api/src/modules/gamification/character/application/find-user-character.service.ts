import { Inject, Injectable } from '@nestjs/common';
import { USER_CHARACTER_REPOSITORY_PORT } from '../ports';
import type { UserCharacterRepositoryPort } from '../ports';
import { UserCharacter } from '../domain/user-character.entity';

@Injectable()
export class FindUserCharacterService {
  constructor(
    @Inject(USER_CHARACTER_REPOSITORY_PORT)
    private readonly characterRepo: UserCharacterRepositoryPort,
  ) { }

  /**
   * 유저의 캐릭터 정보를 조회합니다.
   * 최초 조회 시 캐릭터 정보가 없다면 기본 상태로 생성하여 반환합니다.
   */
  async execute(userId: bigint): Promise<UserCharacter> {
    let character = await this.characterRepo.findByUserId(userId);
    
    if (!character) {
      // 새로운 캐릭터 생성 (Default Level 1, 0 XP)
      character = UserCharacter.create(userId);
      await this.characterRepo.save(character);
    }
    
    return character;
  }
}
