import { Injectable, Logger } from '@nestjs/common';
import { RESERVED_WORDS, ModerationResult } from '../domain/moderation.constants';

export interface ModerationOptions {
    includeAi?: boolean;
}

@Injectable()
export class ModerationService {
    private readonly logger = new Logger(ModerationService.name);

    /**
     * 통합 콘텐츠 검토 (예약어 + AI 등)
     */
    async inspect(text: string, options: ModerationOptions = { includeAi: true }): Promise<ModerationResult> {
        // 1. 예약어 체크 (사칭 방지)
        const reservedResult = await this.checkReservedWords(text);
        if (!reservedResult.isAllowed) {
            return reservedResult;
        }

        // 2. AI 검토 (옵션에 따라 수행)
        if (options.includeAi) {
            // const aiResult = await this.inspectWithAi(text);
            // if (!aiResult.isAllowed) return aiResult;
        }

        return {
            isAllowed: true,
            type: 'ALLOWED',
            message: 'Content is acceptable.',
        };
    }

    /**
     * 시스템 예약어 및 사칭 단어 체크
     */
    async checkReservedWords(text: string): Promise<ModerationResult> {
        const normalizedText = text.toLowerCase().trim();

        // 정확히 일치하거나 포함되어 있는지 확인 (정책에 따라 조정 가능)
        const isReserved = RESERVED_WORDS.some(word => normalizedText.includes(word));

        if (isReserved) {
            return {
                isAllowed: false,
                type: 'RESERVED_WORD',
                message: 'This name contains reserved words and cannot be used.',
            };
        }

        return {
            isAllowed: true,
            type: 'ALLOWED',
            message: 'No reserved words found.',
        };
    }

    /**
     * AI 기반 콘텐츠 분석 (Placeholder)
     */
    private async inspectWithAi(text: string): Promise<ModerationResult> {
        // TODO: OpenAI Moderation API 등 연동
        return {
            isAllowed: true,
            type: 'ALLOWED',
            message: 'AI passed.',
        };
    }
}
