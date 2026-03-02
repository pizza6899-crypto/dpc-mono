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
        const startTime = Date.now();

        try {
            const response = await firstValueFrom(
                this.httpService.post(url, {
                    messages: [
                        {
                            role: 'system',
                            content: `
You are an expert multilingual content moderation assistant.
Your goal is to detect content that violates safety policies.
**Be cautious not to flag harmless, creative, or benign conversations as inappropriate.**

[Detection Categories]
- hate_speech: Encouraging violence or discrimination against specific groups.
- violence: Direct threats of physical harm.
- sexual: Explicit sexual acts or nudity.
- profanity: Severe slurs intended to insult.
- impersonation: Posing as platform staff to scam users.

[Response Format]
Respond ONLY with a JSON object.

{
  "allowed": boolean,
  "confidence": float (0.00 to 1.00),
  "label": "string",
  "reason": "string (concise reason)",
  "potential_violations": ["string"]
}

[Potential Violations Rules]
1. If "allowed" is true, "potential_violations" must be an empty array [].
2. If "allowed" is false, "potential_violations" MUST contain the original input username and 1-2 examples of how it could be used for filter-bypassing (e.g., using special characters, spaces, or similar-looking characters).
3. Limit the total number of items in "potential_violations" to a maximum of 3.

[Examples]
Input: "죽어라 이 00들아"
Output: {"allowed": false, "confidence": 0.96, "label": "violence", "reason": "Death threat", "potential_violations": ["죽어라 이놈들아", "죽어", "죽1어라 이놈"]}

// 1. 유명인 언급 + 농담/친근함 (harmless)
Input: "재용이형구해줘"
Output: {"allowed": true, "confidence": 0.85, "label": "none", "reason": "Benign mention of a public figure, not impersonation", "potential_violations": []}

// 2. 무의미한 단어 나열 (benign)
Input: "핑크돌고래라고"
Output: {"allowed": true, "confidence": 0.95, "label": "none", "reason": "Benign content", "potential_violations": []}

// 3. 약간의 오타나 비문 (benign)
Input: "이게된단고"
Output: {"allowed": true, "confidence": 0.90, "label": "none", "reason": "Harmless typo/dialect", "potential_violations": []}
`,
                        },
                        {
                            role: 'user',
                            content,
                        },
                    ],
                    max_tokens: 200,
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

            const durationMs = Date.now() - startTime;
            const data = response.data;

            // Cloudflare AI 응답 구조: { result: { response: "..." }, success: true }
            if (!data?.success || !data?.result?.response) {
                this.logger.warn(`[CloudflareAI] Unexpected response structure: ${JSON.stringify(data)}`);
                // 파싱 실패 시 안전하게 통과 (false positive 방지)
                return {
                    isAllowed: true,
                    message: 'AI moderation response parsing failed, allowing by default',
                    durationMs,
                    provider: 'cloudflare',
                    model,
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
                // AI 응답의 potential_violations를 flaggedWords로 매핑 (스네이크/카멜 케이스 모두 대응)
                flaggedWords: (parsed.potential_violations || (parsed as any).potentialViolations || [])?.slice(0, 10),
                raw: data,
                durationMs,
                provider: 'cloudflare',
                model,
            };
        } catch (error: any) {
            const durationMs = Date.now() - startTime;
            this.logger.error(`[CloudflareAI] API call failed: ${error.message}`, error.stack);

            // API 장애 시 안전하게 통과 (서비스 가용성 우선)
            return {
                isAllowed: true,
                message: `AI moderation unavailable: ${error.message}`,
                durationMs,
                provider: 'cloudflare',
                model,
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
        potential_violations?: string[];
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
