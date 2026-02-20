// apps/api/src/modules/notification/template/infrastructure/renderers/renderer.factory.ts

import { Injectable } from '@nestjs/common';
import { ChannelType } from '@prisma/client';
import { TemplateRenderer } from '../../ports';
import { HandlebarsRenderer } from './handlebars.renderer';
import { EmailHandlebarsRenderer } from './email-handlebars.renderer';

@Injectable()
export class RendererFactory {
  constructor(
    private readonly handlebarsRenderer: HandlebarsRenderer,
    private readonly emailRenderer: EmailHandlebarsRenderer,
  ) {}

  getRenderer(channel: ChannelType): TemplateRenderer {
    if (channel === ChannelType.EMAIL) {
      return this.emailRenderer;
    }
    // Default to basic handlebars for others
    return this.handlebarsRenderer;
  }
}
