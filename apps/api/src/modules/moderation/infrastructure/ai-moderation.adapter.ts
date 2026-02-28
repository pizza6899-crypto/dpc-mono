import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { EnvService } from 'src/common/env/env.service';
import type { AiModerationPort, AiModerationResult } from '../ports/out/ai-moderation.port';

/**
 * Cloudflare Workers AI 모더레이션 어댑터
 *
 * POST https://api.cloudflare.com/client/v4/accounts/{accountId}/ai/run/{model}
 * Authorization: Bearer {apiToken}
 */
@Injectable()
export class AiModerationAdapter implements AiModerationPort {
    private readonly logger = new Logger(AiModerationAdapter.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly envService: EnvService,
    ) { }

    async check(content: string): Promise<AiModerationResult> {
        const { enabled, accountId, apiToken, model } = this.envService.cloudflareAi;

        // 1. 비활성화 또는 필수 설정(ID/Token) 누락 시 즉시 통과 (Fail-safe)
        if (!enabled || !accountId || !apiToken) {
            if (enabled && (!accountId || !apiToken)) {
                this.logger.error('[CloudflareAI] Enabled but missing required configuration (accountId or apiToken)');
            }
            return {
                isAllowed: true,
                message: 'AI moderation is disabled or misconfigured',
            };
        }

        const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

        try {
            const response = await firstValueFrom(
                this.httpService.post(url, {
                    messages: [
                        {
                            role: 'system',
                            content: [
                                'You are an expert multilingual content moderation assistant.',
                                'Your goal is to detect and prevent filter-bypassing attempts for inappropriate content.',
                                '1. Detect: hate speech, violence, sexual content, slurs, profanity, and impersonation of platform staff or authority figures in any language (especially Korean).',
                                '2. ALWAYS respond strictly in JSON format: { "allowed": boolean, "confidence": number, "label": "string", "reason": "string", "flagged_words": string[] }',
                                '3. If disallowed, "flagged_words" MUST include: The original input string itself, AND At least 3-4 creative variations of the ENTIRE input phrase designed to bypass filters (e.g., if input is "Administrator", include variants like "Admin1strator", "Ad.min.istrator", "@dministrator", "ㅇㄷㅁㄴ").',
                                '4. RULES for flagged_words: DO NOT split the input into separate, neutral words (e.g., do not split "Administrator" into "Strator"). Always preserve the original context and generate variants of the whole phrase. Limit the list to a maximum of 5 items.',
                                '5. If allowed, "flagged_words" must be an empty array [].',
                                '6. Respond with ONLY the JSON object. No intro or outro text.',
                            ].join(' '),
                        },
                        {
                            role: 'user',
                            content,
                        },
                    ],
                    max_tokens: 100,
                    temperature: 0, // 모더레이션은 일관된 판단이 중요하므로 0 고정
                    stream: false,
                }, {
                    headers: {
                        'Authorization': `Bearer ${apiToken}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000, // 10초 타임아웃
                }),
            );

            const data = response.data;

            // Cloudflare AI 응답 구조: { result: { response: "..." }, success: true }
            if (!data?.success || !data?.result?.response) {
                this.logger.warn(`[CloudflareAI] Unexpected response structure: ${JSON.stringify(data)}`);
                // 파싱 실패 시 안전하게 통과 (false positive 방지)
                return {
                    isAllowed: true,
                    message: 'AI moderation response parsing failed, allowing by default',
                };
            }

            // [Debug] AI가 반환한 원본 데이터 로깅
            this.logger.debug(`[CloudflareAI] Raw AI response data: ${JSON.stringify(data)}`);

            // LLM 응답 JSON 파싱
            const parsed = this.parseAiResponse(data.result.response);

            // [Debug] AI가 반환한 원본 데이터 로깅 (flaggedWords 유무 확인용)
            this.logger.debug(`[CloudflareAI] Parsed Content: ${JSON.stringify(parsed)}`);

            return {
                isAllowed: parsed.allowed,
                message: parsed.reason || (parsed.allowed ? 'Content is appropriate' : 'Content is inappropriate'),
                label: parsed.label,
                confidence: parsed.confidence,
                // 스네이크 케이스와 카멜 케이스 모두 대응
                flaggedWords: (parsed.flagged_words || (parsed as any).flaggedWords || [])?.slice(0, 3),
                raw: data,
            };
        } catch (error: any) {
            this.logger.error(`[CloudflareAI] API call failed: ${error.message}`, error.stack);

            // API 장애 시 안전하게 통과 (서비스 가용성 우선)
            return {
                isAllowed: true,
                message: `AI moderation unavailable: ${error.message}`,
            };
        }
    }

    /**
     * LLM의 텍스트 응답에서 JSON을 추출하여 파싱합니다.
     */
    private parseAiResponse(response: string): {
        allowed: boolean;
        confidence?: number;
        label?: string;
        reason?: string;
        flagged_words?: string[];
    } {
        try {
            // JSON 블록 추출 (LLM이 마크다운 코드블럭으로 감쌀 수 있으므로)
            const jsonMatch = response.match(/\{[\s\S]*?\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch {
            this.logger.warn(`[CloudflareAI] Failed to parse AI response: ${response}`);
        }

        // 파싱 실패 시 안전하게 통과
        return { allowed: true, reason: 'Failed to parse AI response' };
    }
}
