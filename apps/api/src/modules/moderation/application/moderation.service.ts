import { Inject, Injectable, Logger } from '@nestjs/common';
import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { ForbiddenWord } from '../domain/model/forbidden-word.entity';
import { AiModerationLog } from '../domain/model/ai-moderation-log.entity';
import { FORBIDDEN_WORD_REPOSITORY, AI_MODERATION_LOG_REPOSITORY } from '../ports/out/moderation-repository.port';
import type { ForbiddenWordRepositoryPort, AiModerationLogRepositoryPort } from '../ports/out/moderation-repository.port';
import { AI_MODERATION_PORT } from '../ports/out/ai-moderation.port';
import type { AiModerationPort, AiModerationResult } from '../ports/out/ai-moderation.port';
import { ForbiddenWordException, AiModerationRejectedException } from '../domain/moderation.exception';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';

@Injectable()
export class ModerationService {
    private readonly logger = new Logger(ModerationService.name);
    private readonly REJECT_CONFIRM_THRESHOLD = 0.8;

    constructor(
        @Inject(FORBIDDEN_WORD_REPOSITORY)
        private readonly forbiddenWordRepository: ForbiddenWordRepositoryPort,
        @Inject(AI_MODERATION_LOG_REPOSITORY)
        private readonly aiModerationLogRepository: AiModerationLogRepositoryPort,
        @Inject(AI_MODERATION_PORT)
        private readonly aiModerationPort: AiModerationPort,
        private readonly snowflakeService: SnowflakeService,
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

            // AI 모더레이션 결과 로그 저장
            await this.saveModerationLog(content, result);

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
     * AI 모더레이션 결과를 DB에 로그로 남깁니다.
     * 상위 트랜잭션이 실패하더라도 로그는 남아야 하므로 새 트랜잭션을 사용합니다.
     */
    @Transactional(Propagation.RequiresNew)
    public async saveModerationLog(input: string, result: AiModerationResult): Promise<void> {
        try {
            const { id: logId, timestamp } = this.snowflakeService.generate();
            const log = AiModerationLog.create({
                id: logId,
                input,
                isAllowed: result.isAllowed,
                label: result.label,
                confidence: result.confidence,
                reason: result.message,
                flaggedWords: result.flaggedWords,
                rawResponse: result.raw,
                provider: result.provider,
                model: result.model,
                durationMs: result.durationMs,
                createdAt: timestamp,
            });

            await this.aiModerationLogRepository.save(log);
        } catch (error: any) {
            // 로그 저장 실패가 메인 로직에 영항을 주지 않도록 로깅만 수행
            this.logger.error(`[AI-Log] Failed to save moderation log: ${error.message}`);
        }
    }

    /**
     * AI 검토 결과를 기반으로 새로운 금지어를 DB에 자동으로 등록합니다.
     * 상위 트랜잭션이 롤백되더라도 학습 내용은 보존되어야 하므로 REQUIRES_NEW 전파 속성을 사용합니다.
     */
    @Transactional(Propagation.RequiresNew)
    public async learnFromAi(originalContent: string, flaggedWords: string[], reason: string): Promise<void> {
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
            this.logger.log(`[Auto-Learn] Successfully added ${forbiddenWords.length} new forbidden words: [${Array.from(wordsToBlock).join(', ')}]`);
        } catch (error: any) {
            this.logger.error(`[Auto-Learn] Failed to save AI-detected words: ${error.message}`);
        }
    }
}
