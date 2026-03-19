import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import type { ForbiddenWordRepositoryPort } from '../../ports/out/moderation-repository.port';
import { FORBIDDEN_WORD_REPOSITORY } from '../../ports/out/moderation-repository.port';
import { ForbiddenWordNotFoundException } from '../../domain/moderation.exception';

@Injectable()
export class DeleteForbiddenWordAdminService {
  constructor(
    @Inject(FORBIDDEN_WORD_REPOSITORY)
    private readonly forbiddenWordRepository: ForbiddenWordRepositoryPort,
  ) {}

  @Transactional()
  async execute(id: bigint): Promise<void> {
    const word = await this.forbiddenWordRepository.findById(id);
    if (!word) {
      throw new ForbiddenWordNotFoundException(id);
    }

    await this.forbiddenWordRepository.delete(id);
  }
}
