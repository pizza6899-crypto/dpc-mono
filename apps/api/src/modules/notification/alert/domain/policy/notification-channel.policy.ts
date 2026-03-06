import { Injectable } from '@nestjs/common';
import { ChannelType } from '@prisma/client';
import { NOTIFICATION_EVENTS } from '../../../common';

@Injectable()
export class NotificationChannelPolicy {
    /**
     * 이벤트 타입에 따라 기본적으로 발송해야 할 채널(ChannelType) 목록을 반환합니다.
     * 향후 유저별 수신 동의/거부 기능이 추가될 경우 이 정책 클래스에서 유저 설정을 조회하여 필터링할 수 있습니다.
     */
    getDefaultChannels(event: string): ChannelType[] {
        switch (event) {
            // 1. 인증: 주로 휴대폰 번호로 인증 코드가 발송되므로 SMS 필수
            case NOTIFICATION_EVENTS.PHONE_VERIFICATION_CODE:
                return [ChannelType.SMS, ChannelType.INBOX]; // INBOX는 이력용

            // 2. 자산 및 기타 알림 (입출금/프로모션): 영구 기록(INBOX) 발송.
            // 실시간 팝업 알림이 필요한 경우 각 서비스에서 WebsocketService를 직접 호출하여 발송합니다.
            case NOTIFICATION_EVENTS.FIAT_DEPOSIT_REQUESTED:
                return [ChannelType.INBOX];

            case NOTIFICATION_EVENTS.PROMOTION_APPLIED:
                return [ChannelType.INBOX];

            case NOTIFICATION_EVENTS.USER_REGISTERED:
                return [ChannelType.INBOX];

            // 기본값
            default:
                return [ChannelType.INBOX]; // 알 수 없는 이벤트는 최소한 INBOX에만 남김
        }
    }
}
