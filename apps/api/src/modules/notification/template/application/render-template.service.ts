// apps/api/src/modules/notification/template/application/render-template.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { ChannelType, Language } from '@repo/database';
import {
    NOTIFICATION_TEMPLATE_REPOSITORY,
    RenderResult,
} from '../ports';
import type { NotificationTemplateRepositoryPort } from '../ports';
import { RendererFactory } from '../infrastructure/renderers/renderer.factory';
import {
    TemplateNotFoundException,
    TemplateTranslationNotFoundException,
} from '../domain/template.exception';

interface RenderTemplateParams {
    event: string;
    channel: ChannelType;
    locale: Language;
    variables: Record<string, unknown>;
}

@Injectable()
export class RenderTemplateService {
    constructor(
        @Inject(NOTIFICATION_TEMPLATE_REPOSITORY)
        private readonly repository: NotificationTemplateRepositoryPort,
        private readonly rendererFactory: RendererFactory,
    ) { }

    async execute(params: RenderTemplateParams): Promise<RenderResult> {
        const { event, channel, locale, variables } = params;

        // 1. 템플릿 조회
        const template = await this.repository.findByEventAndChannel(event, channel);
        if (!template) {
            throw new TemplateNotFoundException(`${event}:${channel}`);
        }

        // 2. 번역 조회
        const translation = template.getTranslation(locale);
        if (!translation) {
            // Fallback logic is inside getTranslation (e.g., lang match or default 'en')
            // If still null, we iterate or fail. strict check here.
            throw new TemplateTranslationNotFoundException(template.id!, locale);
        }

        // 3. 렌더러 선택
        const renderer = this.rendererFactory.getRenderer(channel);

        // 4. 렌더링
        return renderer.render({
            template: translation.bodyTemplate,
            titleTemplate: translation.titleTemplate,
            actionUriTemplate: translation.actionUriTemplate,
            variables,
            locale: translation.locale,
        });
    }
}
