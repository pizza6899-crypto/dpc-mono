import { Injectable } from '@nestjs/common';
import { TierAuditRepositoryPort } from '../../audit/infrastructure/audit.repository.port';
import { TierHistory } from '../../audit/domain/tier-history.entity';
import { GetUserTierHistoryQueryDto } from '../controllers/user/dto/request/get-user-tier-history.query.dto';
import { PaginatedData } from 'src/common/http/types/pagination.types';

@Injectable()
export class GetUserTierHistoryService {
    constructor(
        private readonly tierAuditRepository: TierAuditRepositoryPort,
    ) { }

    async execute(userId: bigint, query: GetUserTierHistoryQueryDto): Promise<PaginatedData<TierHistory>> {
        return this.tierAuditRepository.findHistoryByUserId(userId, {
            startDate: query.startDate,
            endDate: query.endDate,
            page: query.page,
            limit: query.limit,
            changeType: query.changeType,
        });
    }
}
