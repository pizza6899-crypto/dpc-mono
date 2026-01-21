// apps/api/src/modules/notification/template/ports/template-renderer.port.ts

import { ChannelType, Language } from '@prisma/client';

export interface RenderResult {
    title: string;
    body: string;
    actionUri?: string | null;
}

export interface RenderParams {
    template: string; // Handlebars template string for body
    titleTemplate: string; // Handlebars template string for title
    actionUriTemplate?: string | null;
    variables: Record<string, unknown>;
    locale: Language;
}

/**
 * 템플릿 렌더러 인터페이스
 * 채널별로 다른 렌더링 전략을 가질 수 있음 (예: 이메일은 MJML/HTML, 문자는 텍스트)
 */
export interface TemplateRenderer {
    /**
     * 템플릿 렌더링
     */
    render(params: RenderParams): Promise<RenderResult>;

    /**
     * 지원하는 채널
     */
    supports(channel: ChannelType): boolean;
}
