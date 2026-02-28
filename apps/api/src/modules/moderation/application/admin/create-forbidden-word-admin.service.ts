import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import type { ForbiddenWordRepositoryPort } from '../../ports/out/moderation-repository.port';
import { FORBIDDEN_WORD_REPOSITORY } from '../../ports/out/moderation-repository.port';
import { ForbiddenWord } from '../../domain/model/forbidden-word.entity';

export interface CreateForbiddenWordAdminCommand {
    word: string;
    description?: string;
}

@Injectable()
export class CreateForbiddenWordAdminService {
    constructor(
        @Inject(FORBIDDEN_WORD_REPOSITORY)
        private readonly forbiddenWordRepository: ForbiddenWordRepositoryPort,
    ) { }

    @Transactional()
    async execute(command: CreateForbiddenWordAdminCommand): Promise<void> {
        const wordValue = command.word.toLowerCase().trim();
        const existing = await this.forbiddenWordRepository.findByWord(wordValue);

        if (existing) {
            throw new ConflictException(`Forbidden word "${wordValue}" already exists.`);
        }

        const forbiddenWord = ForbiddenWord.create({
            word: wordValue,
            description: command.description,
        });

        await this.forbiddenWordRepository.create(forbiddenWord);
    }
}
