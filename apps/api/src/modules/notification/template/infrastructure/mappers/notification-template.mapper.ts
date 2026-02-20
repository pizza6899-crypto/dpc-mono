// apps/api/src/modules/notification/template/infrastructure/mappers/notification-template.mapper.ts

import { Injectable } from '@nestjs/common';
import {
  NotificationTemplate as PrismaTemplate,
  NotificationTemplateTranslation as PrismaTranslation,
  Prisma,
} from '@prisma/client';
import {
  NotificationTemplate,
  NotificationTemplateTranslation,
} from '../../domain';

type TemplateWithTranslations = PrismaTemplate & {
  translations?: PrismaTranslation[];
};

@Injectable()
export class NotificationTemplateMapper {
  toDomain(model: TemplateWithTranslations): NotificationTemplate {
    const translations = model.translations?.map((t) =>
      NotificationTemplateTranslation.fromPersistence({
        id: t.id,
        templateId: t.templateId,
        locale: t.locale,
        titleTemplate: t.titleTemplate,
        bodyTemplate: t.bodyTemplate,
        actionUriTemplate: t.actionUriTemplate,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }),
    );

    return NotificationTemplate.fromPersistence({
      id: model.id,
      name: model.name,
      description: model.description,
      event: model.event,
      channel: model.channel,
      variables: model.variables as string[],
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      translations: translations,
    });
  }

  toPrisma(entity: NotificationTemplate): {
    name: string;
    description: string | null;
    event: string;
    channel: PrismaTemplate['channel'];
    variables: Prisma.InputJsonValue;
  } {
    return {
      name: entity.name,
      description: entity.description,
      event: entity.event,
      channel: entity.channel,
      variables: entity.variables as Prisma.InputJsonValue,
    };
  }

  toPrismaTranslation(
    entity: NotificationTemplateTranslation,
  ): Omit<PrismaTranslation, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      templateId: entity.templateId!,
      locale: entity.locale,
      titleTemplate: entity.titleTemplate,
      bodyTemplate: entity.bodyTemplate,
      actionUriTemplate: entity.actionUriTemplate,
    };
  }
}
