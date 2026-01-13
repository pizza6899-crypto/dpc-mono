// apps/api/src/modules/notification/template/domain/model/notification-template.entity.ts

import { ChannelType, Language } from '@repo/database';
import { NotificationTemplateTranslation } from './notification-template-translation.entity';

interface CreateTemplateParams {
    name: string;
    description?: string;
    event: string;
    channel: ChannelType;
    variables: string[];
}

interface FromPersistenceParams {
    id: bigint;
    name: string;
    description: string | null;
    event: string;
    channel: ChannelType;
    variables: string[]; // JSON array in DB, parsed to string[] here
    createdAt: Date;
    updatedAt: Date;
    translations?: NotificationTemplateTranslation[];
}

/**
 * NotificationTemplate 도메인 엔티티
 *
 * 알림 템플릿의 메타데이터를 관리합니다.
 * - 이벤트와 채널의 조합으로 유니크하게 식별됩니다.
 * - 실제 콘텐츠(제목, 본문 등)는 Translation 엔티티에서 관리합니다.
 */
export class NotificationTemplate {
    private constructor(
        public readonly id: bigint | null,
        public readonly name: string,
        public readonly description: string | null,
        public readonly event: string,
        public readonly channel: ChannelType,
        public readonly variables: string[],
        public readonly createdAt: Date,
        private _updatedAt: Date,
        private _translations: NotificationTemplateTranslation[],
    ) { }

    static create(params: CreateTemplateParams): NotificationTemplate {
        return new NotificationTemplate(
            null,
            params.name,
            params.description ?? null,
            params.event,
            params.channel,
            params.variables,
            new Date(),
            new Date(),
            [],
        );
    }

    static fromPersistence(data: FromPersistenceParams): NotificationTemplate {
        return new NotificationTemplate(
            data.id,
            data.name,
            data.description,
            data.event,
            data.channel,
            data.variables,
            data.createdAt,
            data.updatedAt,
            data.translations ?? [],
        );
    }

    // Getters
    get updatedAt(): Date {
        return this._updatedAt;
    }

    get translations(): NotificationTemplateTranslation[] {
        return [...this._translations];
    }

    update(params: Partial<CreateTemplateParams>): void {
        if (params.name !== undefined) (this as any).name = params.name;
        if (params.description !== undefined) (this as any).description = params.description ?? null;
        if (params.event !== undefined) (this as any).event = params.event;
        if (params.channel !== undefined) (this as any).channel = params.channel;
        if (params.variables !== undefined) (this as any).variables = params.variables;
        this._updatedAt = new Date();
    }

    clearTranslations(): void {
        this._translations = [];
    }

    addTranslation(translation: NotificationTemplateTranslation): void {
        // 이미 존재하는 로케일인지 확인 (실제로는 Repository 레벨에서 체크하거나 Map으로 관리 가능)
        const exists = this._translations.some((t) => t.locale === translation.locale);
        if (!exists) {
            this._translations.push(translation);
        }
    }

    getTranslation(locale: Language): NotificationTemplateTranslation | undefined {
        // 1. 요청된 언어로 번역 조회
        const translation = this._translations.find((t) => t.locale === locale);
        if (translation) return translation;

        // 2. 부재 시 기본 언어(EN)로 Fallback
        return this._translations.find((t) => t.locale === Language.EN);
    }
}
