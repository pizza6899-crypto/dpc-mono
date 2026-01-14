// apps/api/src/modules/notification/common/interfaces/provider-adapter.interface.ts

/**
 * 외부 Provider 어댑터 인터페이스
 * 각 업체(AWS SES, Twilio, NCloud 등)는 이 인터페이스를 구현
 */
export interface ProviderAdapter<TParams = unknown> {
    /**
     * 메시지 발송
     * @param params Provider별 발송 파라미터
     */
    send(params: TParams): Promise<ProviderResult>;

    /**
     * Provider 이름 반환
     */
    getProviderName(): string;
}

export interface ProviderResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

// Email Provider 파라미터
export interface EmailProviderParams {
    to: string;
    subject: string;
    html: string;
    from?: string;
}

// SMS Provider 파라미터
export interface SMSProviderParams {
    to: string;
    message: string;
    from?: string;
}

// Provider 별 타입 정의
export type EmailProviderAdapter = ProviderAdapter<EmailProviderParams>;
export type SMSProviderAdapter = ProviderAdapter<SMSProviderParams>;
