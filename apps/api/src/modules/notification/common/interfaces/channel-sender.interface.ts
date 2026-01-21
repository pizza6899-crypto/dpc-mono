// apps/api/src/modules/notification/common/interfaces/channel-sender.interface.ts

import { ChannelType } from '@prisma/client';

/**
 * 채널별 발송 인터페이스
 * 각 채널(IN_APP, EMAIL, SMS)은 이 인터페이스를 구현
 */
export interface ChannelSender {
    /**
     * 알림 발송
     * @param params 발송에 필요한 파라미터
     */
    send(params: ChannelSendParams): Promise<void>;

    /**
     * 이 Sender가 담당하는 채널 타입
     */
    getChannelType(): ChannelType;
}

export interface ChannelSendParams {
    logId: bigint;
    logCreatedAt: Date;
    receiverId: bigint;
    target: string | null;
    title: string;
    body: string;
    actionUri: string | null;
    metadata: Record<string, unknown> | null;
}
