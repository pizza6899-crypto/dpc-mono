// apps/api/src/modules/notification/template/ports/notification-template.repository.port.ts

import { ChannelType } from '@prisma/client';
import { NotificationTemplate } from '../domain';

export interface NotificationTemplateRepositoryPort {
    /**
     * 템플릿 생성
     */
    create(template: NotificationTemplate): Promise<NotificationTemplate>;

    /**
     * ID로 조회
     */
    findById(id: bigint): Promise<NotificationTemplate | null>;

    /**
     * 이벤트와 채널로 조회 (유니크)
     */
    findByEventAndChannel(
        event: string,
        channel: ChannelType,
    ): Promise<NotificationTemplate | null>;

    /**
     * 이벤트로 템플릿 목록 조회 (모든 채널)
     */
    findByEvent(event: string): Promise<NotificationTemplate[]>;

    /**
     * 템플릿 업데이트
     */
    update(template: NotificationTemplate): Promise<NotificationTemplate>;

    /**
     * 템플릿 목록 조회
     */
    list(): Promise<NotificationTemplate[]>;

    /**
     * 템플릿 삭제
     */
    delete(id: bigint): Promise<void>;
}
