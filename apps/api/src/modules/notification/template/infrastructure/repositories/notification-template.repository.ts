// apps/api/src/modules/notification/template/infrastructure/repositories/notification-template.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { ChannelType } from 'src/generated/prisma';
import { NotificationTemplateRepositoryPort } from '../../ports';
import { NotificationTemplate } from '../../domain';
import { NotificationTemplateMapper } from '../mappers/notification-template.mapper';

@Injectable()
export class NotificationTemplateRepository implements NotificationTemplateRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: Transaction<TransactionalAdapterPrisma>,
        private readonly mapper: NotificationTemplateMapper,
    ) { }

    async create(template: NotificationTemplate): Promise<NotificationTemplate> {
        const data = this.mapper.toPrisma(template);
        const created = await this.tx.notificationTemplate.create({
            data: {
                ...data,
                translations: {
                    create: template.translations.map((t) => this.mapper.toPrismaTranslation(t)),
                },
            },
            include: {
                translations: true,
            },
        });
        return this.mapper.toDomain(created);
    }

    async findById(id: bigint): Promise<NotificationTemplate | null> {
        const template = await this.tx.notificationTemplate.findUnique({
            where: { id },
            include: {
                translations: true,
            },
        });
        return template ? this.mapper.toDomain(template) : null;
    }

    async findByEventAndChannel(
        event: string,
        channel: ChannelType,
    ): Promise<NotificationTemplate | null> {
        const template = await this.tx.notificationTemplate.findUnique({
            where: {
                event_channel: {
                    event,
                    channel,
                },
            },
            include: {
                translations: true,
            },
        });
        return template ? this.mapper.toDomain(template) : null;
    }

    async findByEvent(event: string): Promise<NotificationTemplate[]> {
        const templates = await this.tx.notificationTemplate.findMany({
            where: { event },
            include: {
                translations: true,
            },
        });
        return templates.map((t) => this.mapper.toDomain(t));
    }

    async update(template: NotificationTemplate): Promise<NotificationTemplate> {
        // 1. Update Template Metadata
        const templateData = this.mapper.toPrisma(template);

        // 2. Transactional Update (Upsert Translations)
        const updated = await this.tx.notificationTemplate.update({
            where: { id: template.id! },
            data: templateData,
            include: { translations: true },
        });

        // 3. Update Translations logic
        for (const trans of template.translations) {
            if (trans.id) {
                await this.tx.notificationTemplateTranslation.update({
                    where: { id: trans.id },
                    data: this.mapper.toPrismaTranslation(trans),
                });
            } else {
                // new translation added in domain entity
                await this.tx.notificationTemplateTranslation.create({
                    data: this.mapper.toPrismaTranslation(trans),
                });
            }
        }

        // Refresh to get full state
        const refreshed = await this.tx.notificationTemplate.findUnique({
            where: { id: template.id! },
            include: { translations: true },
        });

        return this.mapper.toDomain(refreshed!);
    }

    async list(): Promise<NotificationTemplate[]> {
        const templates = await this.tx.notificationTemplate.findMany({
            // where: { isDeleted: false }, // Feature removed from schema so removing from query
            include: {
                translations: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return templates.map((t) => this.mapper.toDomain(t));
    }

    async delete(id: bigint): Promise<void> {
        // Cascade delete is handled by DB for translations usually, but let's be safe or just follow schema.
        await this.tx.notificationTemplateTranslation.deleteMany({
            where: { templateId: id },
        });
        await this.tx.notificationTemplate.delete({
            where: { id },
        });
    }
}
