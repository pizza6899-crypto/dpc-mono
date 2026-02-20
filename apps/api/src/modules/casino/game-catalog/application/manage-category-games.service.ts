import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CATEGORY_REPOSITORY, type CategoryRepositoryPort } from '../ports';
import {
  AddGamesToCategoryRequestDto,
  RemoveGamesFromCategoryRequestDto,
} from '../controllers/admin/dto/request/manage-category-games.request.dto';

@Injectable()
export class AddGamesToCategoryService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly repository: CategoryRepositoryPort,
  ) {}

  @Transactional()
  async execute(
    categoryId: bigint,
    dto: AddGamesToCategoryRequestDto,
  ): Promise<void> {
    await this.repository.getById(categoryId); // 카테고리 존재 확인
    const gameIds = dto.gameIds.map((id) => BigInt(id));
    await this.repository.addGames(categoryId, gameIds);
  }
}

@Injectable()
export class RemoveGamesFromCategoryService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly repository: CategoryRepositoryPort,
  ) {}

  @Transactional()
  async execute(
    categoryId: bigint,
    dto: RemoveGamesFromCategoryRequestDto,
  ): Promise<void> {
    await this.repository.getById(categoryId); // 카테고리 존재 확인
    const gameIds = dto.gameIds.map((id) => BigInt(id));
    await this.repository.removeGames(categoryId, gameIds);
  }
}
