import { Inject, Injectable, Logger } from '@nestjs/common';
import { FORBIDDEN_WORD_REPOSITORY } from '../ports/out/moderation-repository.port';
import type { ForbiddenWordRepositoryPort } from '../ports/out/moderation-repository.port';
import { AI_MODERATION_PORT } from '../ports/out/ai-moderation.port';
import type { AiModerationPort } from '../ports/out/ai-moderation.port';
import { ForbiddenWordException, AiModerationRejectedException } from '../domain/moderation.exception';

@Injectable()
export class ModerationService {
    private readonly logger = new Logger(ModerationService.name);

    constructor(
        @Inject(FORBIDDEN_WORD_REPOSITORY)
        private readonly forbiddenWordRepository: ForbiddenWordRepositoryPort,
        @Inject(AI_MODERATION_PORT)
        private readonly aiModerationPort: AiModerationPort,
    ) { }

    /**
     * 콘텐츠 검증 (금지어 + AI)
     *
     * @param content  검사할 텍스트
     * @param options  skipAi: true 이면 AI 검토를 건너뜁니다 (가용성 체크 등 빠른 응답이 필요한 경우)
     */
    async verify(content: string, options?: { skipAi?: boolean }): Promise<void> {
        const input = content.toLowerCase().trim();

        // 1. DB 금지어 체크 (정확히 일치하는 단어만)
        const isForbidden = await this.forbiddenWordRepository.exists(input);
        if (isForbidden) {
            throw new ForbiddenWordException(input);
        }

        // 2. AI 검토 (skipAi가 아닐 때만)
        if (!options?.skipAi) {
            const result = await this.aiModerationPort.check(content);
            if (!result.isAllowed) {
                throw new AiModerationRejectedException(result.message);
            }
        }
    }
}
