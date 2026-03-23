import { Inject, Injectable } from '@nestjs/common';
import { type ItemCatalog } from '../domain/item-catalog.entity';
import { ITEM_CATALOG_REPOSITORY_PORT, type ItemCatalogRepositoryPort } from '../ports/item-catalog.repository.port';
import { type GetItemCatalogAdminQueryDto } from '../controllers/admin/dto/request/get-item-catalog-admin-query.dto';
import { type PaginatedData } from 'src/common/http/types/pagination.types';

@Injectable()
export class GetItemCatalogListService {
  constructor(
    @Inject(ITEM_CATALOG_REPOSITORY_PORT)
    private readonly repository: ItemCatalogRepositoryPort,
  ) { }

  /**
   * 전체 아이템 목록 조회 (페이징 지원)
   */
  async execute(query: GetItemCatalogAdminQueryDto): Promise<PaginatedData<ItemCatalog>> {
    const [list, total] = await Promise.all([
      this.repository.findManyPaginated({
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        type: query.type,
        search: query.search,
      }),
      this.repository.count({
        type: query.type,
        search: query.search,
      }),
    ]);

    return {
      data: list,
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
  }
}
