// apps/api/src/modules/notification/template/infrastructure/renderers/email-handlebars.renderer.ts

import { Injectable, Logger } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import { ChannelType, Language } from 'src/generated/prisma';
import {
    TemplateRenderer,
    RenderParams,
    RenderResult,
} from '../../ports';

import { EmailLayouts } from './layouts/email-layouts';

@Injectable()
export class EmailHandlebarsRenderer implements TemplateRenderer {
    private readonly logger = new Logger(EmailHandlebarsRenderer.name);

    constructor() {
        this.registerHelpers();
    }

    private registerHelpers() {
        // Button Helper
        // Usage: {{button "Click Here" url="https://example.com" fullWidth=true}}
        Handlebars.registerHelper('button', function (text: string, options: any) {
            const url = options.hash.url || '#';
            const fullWidth = options.hash.fullWidth || false;
            // root context에서 accentColor 가져오기 (없으면 기본값)
            const accentColor = options.data.root._accentColor || '#007bff';

            const widthStyle = fullWidth ? 'display: block; width: 100%; text-align: center;' : 'display: inline-block;';

            return new Handlebars.SafeString(`
                <a href="${url}" class="button" style="${widthStyle} background-color: ${accentColor}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
                    ${text}
                </a>
            `);
        });

        // Spacer Helper
        // Usage: {{spacer 20}}
        Handlebars.registerHelper('spacer', function (height: number) {
            const h = typeof height === 'number' ? height : 20;
            return new Handlebars.SafeString(`<div style="height: ${h}px; line-height: ${h}px;">&nbsp;</div>`);
        });

        // Divider Helper
        // Usage: {{divider}}
        Handlebars.registerHelper('divider', function () {
            return new Handlebars.SafeString('<hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">');
        });
    }

    async render(params: RenderParams): Promise<RenderResult> {
        try {
            // 2. Prepare variables (add system variables & defaults)
            const footer = this.getFooterMessages(params.locale);
            const variables = {
                appName: 'app service', // TODO: Config에서 가져오기
                year: new Date().getFullYear(),
                _accentColor: '#007bff', // 기본 강조 색상
                _layout: 'default',      // 기본 레이아웃
                _footerCopyright: footer.copyright,
                _footerNoReply: footer.noReply,
                ...params.variables,     // 사용자/시스템 변수가 덮어씀
            };

            // 3. Select Layout
            const layoutName = (variables._layout as string) in EmailLayouts
                ? variables._layout as keyof typeof EmailLayouts
                : 'default';
            const layoutTemplate = EmailLayouts[layoutName];

            // 4. Compile templates
            const titleCompiled = Handlebars.compile(params.titleTemplate);
            const bodyCompiled = Handlebars.compile(params.template);
            const actionUriCompiled = params.actionUriTemplate
                ? Handlebars.compile(params.actionUriTemplate)
                : null;
            const layoutCompiled = Handlebars.compile(layoutTemplate);

            // 5. Execute with variables
            const title = titleCompiled(variables);
            const contentBody = bodyCompiled(variables);
            const actionUri = actionUriCompiled
                ? actionUriCompiled(variables)
                : null;

            // 6. Wrap with Layout
            const fullHtml = layoutCompiled({
                ...variables,
                body: contentBody,
            });

            return {
                title,
                body: fullHtml,
                actionUri,
            };
        } catch (error: any) {
            this.logger.error(
                `Failed to render email template for locale ${params.locale}: ${error.message}`,
                error.stack,
            );
            throw new Error(`Email template rendering failed: ${error.message}`);
        }
    }

    private getFooterMessages(locale: Language): { copyright: string; noReply: string } {
        switch (locale) {
            case Language.KO:
                return {
                    copyright: 'All rights reserved.',
                    noReply: '본 메일은 발신 전용입니다.',
                };
            case Language.JA:
                return {
                    copyright: 'All rights reserved.',
                    noReply: 'このメールは送信専用です。',
                };
            case Language.EN:
                return {
                    copyright: 'All rights reserved.',
                    noReply: 'This is a no-reply email.',
                };
            default:
                return {
                    copyright: 'All rights reserved.',
                    noReply: 'This is a no-reply email.',
                };
        }
    }

    supports(channel: ChannelType): boolean {
        return channel === ChannelType.EMAIL;
    }
}
