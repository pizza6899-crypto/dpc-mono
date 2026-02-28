import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import type { ForbiddenWordRepositoryPort } from '../../ports/out/moderation-repository.port';
import { FORBIDDEN_WORD_REPOSITORY } from '../../ports/out/moderation-repository.port';

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
            throw new NotFoundException(`Forbidden word with ID ${command.id} not found.`);
        }

        await this.forbiddenWordRepository.update(command.id, {
            description: command.description,
            isActive: command.isActive,
        });
    }
}
