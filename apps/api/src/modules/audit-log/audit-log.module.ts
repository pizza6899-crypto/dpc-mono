/**
 * Audit Log Module
 *
 * 범용 로깅 인프라 모듈
 *
 * ## 로그 타입
 * - **AUTH**: 보안/인증 관련 중요한 이벤트 (CRITICAL 큐)
 * - **INTEGRATION**: 외부 서비스 연동 (CRITICAL 큐)
 * - **ACTIVITY**: 사용자 활동 추적 (HEAVY 큐)
 * - **ERROR**: 시스템 에러/예외 (HEAVY 큐)
 *
 * ## 사용 가이드
 * 자세한 사용 방법은 `AUDIT_LOG_USAGE_GUIDE.md`를 참고하세요.
 *
 * @example
 * ```typescript
 * // 로그인 성공
 * await dispatchLogService.dispatch({
 *   type: LogType.AUTH,
 *   data: {
 *     userId: user.id.toString(),
 *     action: 'LOGIN',
 *     status: 'SUCCESS',
 *     ip: requestInfo.ip,
 *     userAgent: requestInfo.userAgent,
 *   },
 * });
 * ```
 */
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuditLogAdapter } from './infrastructure/audit-log.adapter';
import {
  CriticalLogProcessor,
  HeavyLogProcessor,
} from './infrastructure/audit-log.processor';
import { DispatchLogService } from './application/dispatch-log.service';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { AUDIT_LOG_REPOSITORY } from './ports/out';
import {
  CRITICAL_LOG_QUEUE_CONFIG,
  HEAVY_LOG_QUEUE_CONFIG,
} from './infrastructure/queue.constants';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue(CRITICAL_LOG_QUEUE_CONFIG),
    BullModule.registerQueue(HEAVY_LOG_QUEUE_CONFIG),
  ],
  providers: [
    {
      provide: AUDIT_LOG_REPOSITORY,
      useClass: AuditLogAdapter,
    },
    CriticalLogProcessor,
    HeavyLogProcessor,
    DispatchLogService,
  ],
  exports: [AUDIT_LOG_REPOSITORY, DispatchLogService],
})
export class AuditLogModule {}

