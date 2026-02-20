import { Injectable, Inject } from '@nestjs/common';
import { ChannelType, Language } from '@prisma/client';
import { NOTIFICATION_TEMPLATE_REPOSITORY } from '../ports';
import type { NotificationTemplateRepositoryPort } from '../ports';
import {
  NotificationTemplate,
  NotificationTemplateTranslation,
} from '../domain';
import {
  TemplateNotFoundException,
  DuplicateTemplateException,
} from '../domain/template.exception';

interface UpdateTemplateParams {
  id: bigint;
  name?: string;
  description?: string;
  event?: string;
  channel?: ChannelType;
  variables?: string[];
  translations?: {
    locale: Language;
    titleTemplate: string;
    bodyTemplate: string;
    actionUriTemplate?: string;
  }[];
}

@Injectable()
export class UpdateTemplateService {
  constructor(
    @Inject(NOTIFICATION_TEMPLATE_REPOSITORY)
    private readonly repository: NotificationTemplateRepositoryPort,
  ) {}

  async execute({
    id,
    ...params
  }: UpdateTemplateParams): Promise<NotificationTemplate> {
    const template = await this.repository.findById(id);
    if (!template) {
      throw new TemplateNotFoundException(id);
    }

    // Check for duplicates if event or channel is changed
    if (
      (params.event && params.event !== template.event) ||
      (params.channel && params.channel !== template.channel)
    ) {
      const newEvent = params.event ?? template.event;
      const newChannel = params.channel ?? template.channel;
      const existing = await this.repository.findByEventAndChannel(
        newEvent,
        newChannel,
      );

      if (existing && existing.id !== template.id) {
        throw new DuplicateTemplateException(newEvent, newChannel);
      }
    }

    // Apply changes
    template.update(params);

    if (params.translations) {
      template.clearTranslations();
      for (const t of params.translations) {
        template.addTranslation(
          NotificationTemplateTranslation.create({
            locale: t.locale,
            titleTemplate: t.titleTemplate,
            bodyTemplate: t.bodyTemplate,
            actionUriTemplate: t.actionUriTemplate,
          }),
        );
      }
    }

    return await this.repository.update(template);
  }
}
