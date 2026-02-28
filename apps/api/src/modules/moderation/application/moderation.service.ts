import { Inject, Injectable, Logger } from '@nestjs/common';
import { ForbiddenWord } from '../domain/model/forbidden-word.entity';
import { FORBIDDEN_WORD_REPOSITORY } from '../ports/out/moderation-repository.port';
import type { ForbiddenWordRepositoryPort } from '../ports/out/moderation-repository.port';
import { AI_MODERATION_PORT } from '../ports/out/ai-moderation.port';
import type { AiModerationPort } from '../ports/out/ai-moderation.port';
import { ForbiddenWordException, AiModerationRejectedException } from '../domain/moderation.exception';

@Injectable()
export class ModerationService {
    private readonly logger = new Logger(ModerationService.name);
    private readonly REJECT_CONFIRM_THRESHOLD = 0.5;

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

            // AI가 불합격 시켰더라도, 신뢰도가 너무 낮으면(오탐 방지) 통과
            if (!result.isAllowed) {
                if ((result.confidence ?? 0) >= this.REJECT_CONFIRM_THRESHOLD) {
                    this.logger.warn(`AI Moderation Rejected: "${content}" (Reason: ${result.message}, Flagged: ${result.flaggedWords?.join(', ')})`);

                    // DB 자동 학습 처리 (검사된 키워드 및 AI 감지 단어 추가)
                    await this.learnFromAi(content, result.flaggedWords || [], result.message);

                    throw new AiModerationRejectedException(result.message, result.flaggedWords);
                }
                this.logger.warn(`AI rejected but confidence too low (${result.confidence}), allowing as potential false positive: "${content}"`);
            }
        }
    }

    /**
     * AI 검토 결과를 기반으로 새로운 금지어를 DB에 자동으로 등록합니다.
     */
    private async learnFromAi(originalContent: string, flaggedWords: string[], reason: string): Promise<void> {
        try {
            // 중복 단어 제거를 위해 Set 사용
            const wordsToBlock = new Set<string>();
            wordsToBlock.add(originalContent.toLowerCase().trim());
            flaggedWords.forEach(word => wordsToBlock.add(word.toLowerCase().trim()));

            const forbiddenWords = Array.from(wordsToBlock).map(word =>
                ForbiddenWord.create({
                    word,
                    description: `AI Auto-Learned: ${reason}`
                })
            );

            await this.forbiddenWordRepository.saveAll(forbiddenWords);
            this.logger.log(`[Auto-Learn] Successfully added ${forbiddenWords.length} new forbidden words.`);
        } catch (error: any) {
            this.logger.error(`[Auto-Learn] Failed to save AI-detected words: ${error.message}`);
        }
    }
}
