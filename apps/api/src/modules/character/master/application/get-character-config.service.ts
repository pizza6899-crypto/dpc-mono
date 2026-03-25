import { Inject, Injectable } from '@nestjs/common';
import { CharacterConfigNotFoundException } from '../domain/master.exception';
import { CharacterConfig } from '../domain/character-config.entity';
import {
  CHARACTER_CONFIG_REPOSITORY_PORT,
} from '../ports/character-config.repository.port';
import type { CharacterConfigRepositoryPort } from '../ports/character-config.repository.port';

@Injectable()
export class GetCharacterConfigService {
  constructor(
    @Inject(CHARACTER_CONFIG_REPOSITORY_PORT)
    private readonly repository: CharacterConfigRepositoryPort,
  ) { }

  /**
   * 전역 캐릭터 정책 설정을 조회합니다.
   * 데이터가 없을 경우 시스템 장애로 간주하여 예외를 발생시킵니다 (Seeding 필수).
   */
  async execute(): Promise<CharacterConfig> {
    const config = await this.repository.findConfig();

    if (!config) {
      throw new CharacterConfigNotFoundException();
    }

    return config;
  }
}
