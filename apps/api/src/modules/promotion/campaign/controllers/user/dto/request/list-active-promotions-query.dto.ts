// src/modules/promotion/campaign/controllers/user/dto/request/list-active-promotions-query.dto.ts
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';

type PromotionSortFields = 'createdAt' | 'updatedAt' | 'id';

export class ListActivePromotionsQueryDto extends createPaginationQueryDto<PromotionSortFields>(
  {
    defaultLimit: 20,
    maxLimit: 50,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  },
  ['createdAt', 'updatedAt', 'id'],
) {
  // Language and Currency will be extracted from the user session in the controller.
}
