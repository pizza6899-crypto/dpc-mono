import { Injectable } from '@nestjs/common';
import { SupportStatus } from '@prisma/client';

@Injectable()
export class SupportInquiryPolicy {
    /**
     * 유저가 메시지를 보냈을 때 상담 방의 다음 상태를 결정합니다.
     */
    calculateStatusOnMessage(currentStatus: SupportStatus | null, isAdmin: boolean): SupportStatus | null {
        if (isAdmin) {
            // 관리자가 답장하면 '상담 중'으로 변경 (현재 OPEN인 경우에만)
            if (currentStatus === SupportStatus.OPEN) {
                return SupportStatus.IN_PROGRESS;
            }
            return null;
        }

        // 유저가 메시지를 보낼 때:
        // 1. 처음 입장(ENTERED) 상태이면 -> OPEN
        // 2. 상담 종료(CLOSED) 상태였으면 -> OPEN (재오픈)
        // 3. 펜딩(PENDING) 상태였으면 -> OPEN (알림 대응)
        if (
            currentStatus === SupportStatus.ENTERED ||
            currentStatus === SupportStatus.CLOSED ||
            currentStatus === SupportStatus.PENDING
        ) {
            return SupportStatus.OPEN;
        }

        return null;
    }

    /**
     * 관리자에게 실시간 알림을 보낼지 여부를 결정합니다.
     */
    shouldNotifyAdmin(currentStatus: SupportStatus | null, isAdmin: boolean): boolean {
        if (isAdmin) return false;

        // 관리자가 즉시 확인해야 하는 상태 전환 시 알림 발송
        return (
            currentStatus === SupportStatus.ENTERED ||
            currentStatus === SupportStatus.CLOSED ||
            currentStatus === SupportStatus.PENDING
        );
    }

    /**
     * 기존 방에 재입입 시(종료 상태 포함) 초기 상태를 결정합니다.
     */
    getStatusForReopening(currentStatus: SupportStatus | null): SupportStatus | null {
        if (currentStatus === SupportStatus.CLOSED) {
            return SupportStatus.ENTERED;
        }
        return null;
    }
}
