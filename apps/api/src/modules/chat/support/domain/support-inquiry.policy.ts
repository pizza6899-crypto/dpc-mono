import { Injectable } from '@nestjs/common';
import { SupportStatus } from '@prisma/client';

@Injectable()
export class SupportInquiryPolicy {
    /**
     * 유저가 메시지를 보냈을 때 상담 방의 다음 상태를 결정합니다.
     */
    calculateStatusOnMessage(currentStatus: SupportStatus | null, isAdmin: boolean): SupportStatus | null {
        if (isAdmin) {
            // 관리자가 답장하면 현재 상태가 종료(CLOSED)가 아닌 경우 모두 '진행 중'으로 변경
            if (currentStatus !== SupportStatus.CLOSED && currentStatus !== SupportStatus.IN_PROGRESS) {
                return SupportStatus.IN_PROGRESS;
            }
            return null;
        }

        // 유저가 메시지를 보낼 때:
        // 1. 단순 입장(ENTERED) 후에 첫 질문을 함 -> OPEN
        // 2. 관리자가 펜딩(PENDING) 처리했는데 추가 질문을 함 -> OPEN
        // 3. 종료(CLOSED)된 상담인데 다시 질문을 함 -> OPEN
        if (
            currentStatus === SupportStatus.ENTERED ||
            currentStatus === SupportStatus.PENDING ||
            currentStatus === SupportStatus.CLOSED
        ) {
            return SupportStatus.OPEN;
        }

        // 이미 상담사가 배정되어 진행 중(IN_PROGRESS)인 상태에서는 유저가 보내도 상태 유지
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
