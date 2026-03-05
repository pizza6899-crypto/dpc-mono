// apps/api/src/modules/notification/template/infrastructure/renderers/handlebars.renderer.ts

import { Injectable, Logger } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import { ChannelType } from '@prisma/client';
import { TemplateRenderer, RenderParams, RenderResult } from '../../ports';

@Injectable()
export class HandlebarsRenderer implements TemplateRenderer {
  private readonly logger = new Logger(HandlebarsRenderer.name);

  async render(params: RenderParams): Promise<RenderResult> {
    try {
      // 1. Compile templates
      const titleCompiled = Handlebars.compile(params.titleTemplate);
      const bodyCompiled = Handlebars.compile(params.template);
      const actionUriCompiled = params.actionUriTemplate
        ? Handlebars.compile(params.actionUriTemplate)
        : null;

      // 2. Execute with variables
      const title = titleCompiled(params.variables);
      const body = bodyCompiled(params.variables);
      const actionUri = actionUriCompiled
        ? actionUriCompiled(params.variables)
        : null;

      return {
        title,
        body,
        actionUri,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to render template for locale ${params.locale}: ${error.message}`,
        error.stack,
      );
      throw new Error(`Template rendering failed: ${error.message}`);
    }
  }

  supports(channel: ChannelType): boolean {
    const supportedChannels: ChannelType[] = [
      ChannelType.SMS,
      ChannelType.INBOX,
    ];
    return supportedChannels.includes(channel);
  }
}
