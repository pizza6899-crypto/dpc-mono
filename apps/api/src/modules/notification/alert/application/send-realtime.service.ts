import { Injectable } from '@nestjs/common';
import { SocketService } from 'src/modules/socket/socket.service';
import { RealtimePayloadMap } from '../../common';

export interface SendRealtimeParams<T extends keyof RealtimePayloadMap> {
    /** 수신 대상 사용자 ID (시스템 내부 표준인 bigint 사용) */
    userId?: bigint;

    /** 특정 룸(채널) 대상 (예: 'admin', 'lobby') */
    room?: string;

    /** 이벤트명 (REALTIME_EVENTS 상수 사용 권장) */
    event: T;

    /** 전달할 데이터 객체 (이벤트별로 타입이 정의됨) */
    payload: RealtimePayloadMap[T];
}

/**
 * 휘발성 실시간 메시지 발송 서비스
 * DB에 저장하지 않고 소켓을 통해 즉시 전달합니다.
 */
@Injectable()
export class SendRealtimeService {
    constructor(private readonly socketService: SocketService) { }

    async execute<T extends keyof RealtimePayloadMap>(params: SendRealtimeParams<T>): Promise<void> {
        const { userId, room, event, payload } = params;

        if (userId) {
            // 특정 사용자에게 전송
            this.socketService.sendToUser(userId, event as string, payload);
        } else if (room) {
            // 특정 룸에 전송
            this.socketService.sendToRoom(room, event as string, payload);
        } else {
            // 전체 브로드캐스트
            this.socketService.broadcast(event as string, payload);
        }
    }
}
