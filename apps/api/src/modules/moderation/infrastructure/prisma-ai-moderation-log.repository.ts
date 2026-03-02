import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { AiModerationLogRepositoryPort } from '../ports/out/moderation-repository.port';
import { AiModerationLog as AiModerationLogEntity } from '../domain/model/ai-moderation-log.entity';

@Injectable()
export class PrismaAiModerationLogRepository implements AiModerationLogRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) {}

  async save(log: AiModerationLogEntity): Promise<void> {
    await this.tx.aiModerationLog.create({
      data: {
        id: log.id,
        input: log.input,
        isAllowed: log.isAllowed,
        label: log.label,
        confidence: log.confidence,
        reason: log.reason,
        flaggedWords: log.flaggedWords,
        rawResponse: log.rawResponse,
        provider: log.provider,
        model: log.model,
        durationMs: log.durationMs,
        createdAt: log.createdAt,
      },
    });
  }
}
