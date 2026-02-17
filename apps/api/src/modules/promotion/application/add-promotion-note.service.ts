// src/modules/promotion/application/add-promotion-note.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Promotion, PromotionNotFoundException } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';

@Injectable()
export class AddPromotionNoteService {
    private readonly logger = new Logger(AddPromotionNoteService.name);

    constructor(
        @Inject(PROMOTION_REPOSITORY)
        private readonly repository: PromotionRepositoryPort,
    ) { }

    @Transactional()
    async execute(id: bigint, note: string): Promise<Promotion> {
        const promotion = await this.repository.findById(id);
        if (!promotion) {
            throw new PromotionNotFoundException();
        }

        promotion.addNote(note);
        const updated = await this.repository.update({
            id: promotion.id,
            note: promotion.note,
        });

        this.logger.log(`Note added to promotion: id=${id}`);
        return updated;
    }
}
