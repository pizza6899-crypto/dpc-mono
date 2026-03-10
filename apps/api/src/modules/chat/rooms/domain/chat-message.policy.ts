import { Injectable } from '@nestjs/common';
import { ChatMessage } from './chat-message.entity';

@Injectable()
export class ChatMessagePolicy {
    /**
     * 메시지 수정 가능 여부를 판단합니다.
     */
    canUpdate(message: ChatMessage, requesterId: bigint, isAdmin: boolean): boolean {
        // 이미 삭제된 메시지는 수정 불가
        if (message.isDeleted) return false;

        // 시스템 메시지는 수정 불가
        if (!message.senderId) return false;

        // 어드민은 모든 메시지 수정 가능 (또는 본인 메시지만 - 프로젝트 정책에 따름)
        if (isAdmin) return true;

        // 일반 유저는 본인 메시지만 수정 가능
        return message.senderId === requesterId;
    }

    /**
     * 메시지 삭제 가능 여부를 판단합니다.
     */
    canDelete(message: ChatMessage, requesterId: bigint, isAdmin: boolean): boolean {
        // 이미 삭제된 메시지는 중복 삭제 의미 없음
        if (message.isDeleted) return false;

        // 시스템 메시지는 삭제 불가 (필요시 허용)
        if (!message.senderId) return false;

        if (isAdmin) return true;

        return message.senderId === requesterId;
    }
}
