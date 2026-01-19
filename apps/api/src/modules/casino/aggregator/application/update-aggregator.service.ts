import { Inject, Injectable } from '@nestjs/common';
import { CasinoAggregator } from '../domain';
import { CASINO_AGGREGATOR_REPOSITORY } from '../ports';
import type { CasinoAggregatorRepositoryPort } from '../ports';
import { AggregatorStatus } from '@repo/database';

interface UpdateAggregatorCommand {
    id: bigint;
    name?: string;
    status?: AggregatorStatus;
    apiEnabled?: boolean;
}

@Injectable()
export class UpdateAggregatorService {
    constructor(
        @Inject(CASINO_AGGREGATOR_REPOSITORY)
        private readonly repository: CasinoAggregatorRepositoryPort,
    ) { }

    async execute(command: UpdateAggregatorCommand): Promise<CasinoAggregator> {
        const aggregator = await this.repository.getById(command.id);

        // 변경된 내용 적용 (불변성 유지하며 새 객체 생성)
        const updatedAggregator = CasinoAggregator.create({
            id: aggregator.id!,
            name: command.name ?? aggregator.name,
            code: aggregator.code,
            status: command.status ?? aggregator.status,
            apiEnabled: command.apiEnabled ?? aggregator.apiEnabled,
            createdAt: aggregator.createdAt,
            updatedAt: new Date(),
        });

        return this.repository.update(updatedAggregator);
    }
}
