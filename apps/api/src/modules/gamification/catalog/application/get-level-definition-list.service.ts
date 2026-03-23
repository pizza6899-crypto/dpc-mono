import { Inject, Injectable } from '@nestjs/common';
import {
  LEVEL_DEFINITION_REPOSITORY_PORT,
} from '../ports/level-definition.repository.port';
import type { LevelDefinitionRepositoryPort } from '../ports/level-definition.repository.port';
import { LevelDefinition } from '../domain/level-definition.entity';

@Injectable()
export class GetLevelDefinitionListService {
  constructor(
    @Inject(LEVEL_DEFINITION_REPOSITORY_PORT)
    private readonly repository: LevelDefinitionRepositoryPort,
  ) { }

  /**
   * 게이미피케이션의 모든 레벨 정의 정보를 조회합니다.
   */
  async execute(): Promise<LevelDefinition[]> {
    return await this.repository.findAll();
  }
}
