// apps/api/src/modules/notification/template/domain/model/notification-template-translation.entity.ts

interface CreateTranslationParams {
    templateId?: bigint; // 생성 시점엔 없을 수 있음 (부모와 함께 저장 시)
    locale: string;
    titleTemplate: string;
    bodyTemplate: string;
    actionUriTemplate?: string;
}

interface FromPersistenceParams {
    id: bigint;
    templateId: bigint;
    locale: string;
    titleTemplate: string;
    bodyTemplate: string;
    actionUriTemplate: string | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * NotificationTemplateTranslation 도메인 엔티티
 *
 * 템플릿의 언어별 콘텐츠를 관리합니다.
 * - Handlebars 문법을 사용한 템플릿 문자열을 저장합니다.
 */
export class NotificationTemplateTranslation {
    private constructor(
        public readonly id: bigint | null,
        public readonly templateId: bigint | null,
        public readonly locale: string,
        public readonly titleTemplate: string,
        public readonly bodyTemplate: string,
        public readonly actionUriTemplate: string | null,
        public readonly createdAt: Date,
        private _updatedAt: Date,
    ) { }

    static create(params: CreateTranslationParams): NotificationTemplateTranslation {
        return new NotificationTemplateTranslation(
            null,
            params.templateId ?? null,
            params.locale,
            params.titleTemplate,
            params.bodyTemplate,
            params.actionUriTemplate ?? null,
            new Date(),
            new Date(),
        );
    }

    static fromPersistence(
        data: FromPersistenceParams,
    ): NotificationTemplateTranslation {
        return new NotificationTemplateTranslation(
            data.id,
            data.templateId,
            data.locale,
            data.titleTemplate,
            data.bodyTemplate,
            data.actionUriTemplate,
            data.createdAt,
            data.updatedAt,
        );
    }

    get updatedAt(): Date {
        return this._updatedAt;
    }

    update(params: Partial<CreateTranslationParams>): void {
        if (params.titleTemplate !== undefined) {
            // @ts-ignore - readonly override
            this.titleTemplate = params.titleTemplate;
        }
        if (params.bodyTemplate !== undefined) {
            // @ts-ignore - readonly override
            this.bodyTemplate = params.bodyTemplate;
        }
        if (params.actionUriTemplate !== undefined) {
            // @ts-ignore - readonly override
            this.actionUriTemplate = params.actionUriTemplate ?? null;
        }
        this._updatedAt = new Date();
    }
}
