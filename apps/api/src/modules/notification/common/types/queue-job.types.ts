/**
 * 알림 모듈 BullMQ 큐 잡 데이터 타입 정의
 */

/**
 * 알림 로그(NotificationLog) 처리를 위한 큐 잡 데이터
 * EMAIL, SMS, SOCKET 큐에서 사용됩니다.
 */
export interface NotificationJobData {
    logId: string;
    logCreatedAt: string;
}

/**
 * 알림(Alert) 분배 처리를 위한 큐 잡 데이터
 * ALERT 큐에서 사용됩니다.
 */
export interface AlertJobData {
    alertId: string;
    alertCreatedAt: string;
}
