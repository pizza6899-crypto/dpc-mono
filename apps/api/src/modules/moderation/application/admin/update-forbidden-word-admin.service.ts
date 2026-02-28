import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import type { ForbiddenWordRepositoryPort } from '../../ports/out/moderation-repository.port';
import { FORBIDDEN_WORD_REPOSITORY } from '../../ports/out/moderation-repository.port';
import { ForbiddenWordNotFoundException } from '../../domain/moderation.exception';

export interface UpdateForbiddenWordAdminCommand {
    id: bigint;
    description?: string;
    isActive?: boolean;
}

@Injectable()
export class UpdateForbiddenWordAdminService {
    constructor(
        @Inject(FORBIDDEN_WORD_REPOSITORY)
        private readonly forbiddenWordRepository: ForbiddenWordRepositoryPort,
    ) { }

    @Transactional()
    async execute(command: UpdateForbiddenWordAdminCommand): Promise<void> {
        const word = await this.forbiddenWordRepository.findById(command.id);
        if (!word) {
            throw new ForbiddenWordNotFoundException(command.id);
        }

        await this.forbiddenWordRepository.update(command.id, {
            description: command.description,
            isActive: command.isActive,
        });
    }
}
