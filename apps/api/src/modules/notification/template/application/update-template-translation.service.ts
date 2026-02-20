// apps/api/src/modules/notification/template/application/update-template-translation.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { Language } from '@prisma/client';
import { NOTIFICATION_TEMPLATE_REPOSITORY } from '../ports';
import type { NotificationTemplateRepositoryPort } from '../ports';
import {
  NotificationTemplate,
  NotificationTemplateTranslation,
} from '../domain';
import { TemplateNotFoundException } from '../domain/template.exception';

interface UpdateTemplateTranslationParams {
  templateId: bigint;
  locale: Language;
  titleTemplate: string;
  bodyTemplate: string;
  actionUriTemplate?: string;
}

@Injectable()
export class UpdateTemplateTranslationService {
  constructor(
    @Inject(NOTIFICATION_TEMPLATE_REPOSITORY)
    private readonly repository: NotificationTemplateRepositoryPort,
  ) {}

  async execute(
    params: UpdateTemplateTranslationParams,
  ): Promise<NotificationTemplate> {
    // 1. 템플릿 조회
    const template = await this.repository.findById(params.templateId);
    if (!template) {
      throw new TemplateNotFoundException(params.templateId);
    }

    // 2. 기존 번역 찾기
    const existingTranslation = template.getTranslation(params.locale);

    if (existingTranslation) {
      // 2-1. 업데이트
      existingTranslation.update({
        titleTemplate: params.titleTemplate,
        bodyTemplate: params.bodyTemplate,
        actionUriTemplate: params.actionUriTemplate,
      });
    } else {
      // 2-2. 새로 생성 (Upsert)
      const newTranslation = NotificationTemplateTranslation.create({
        templateId: template.id!,
        locale: params.locale,
        titleTemplate: params.titleTemplate,
        bodyTemplate: params.bodyTemplate,
        actionUriTemplate: params.actionUriTemplate,
      });
      template.addTranslation(newTranslation);
    }

    // 3. 저장
    return await this.repository.update(template);
  }
}
