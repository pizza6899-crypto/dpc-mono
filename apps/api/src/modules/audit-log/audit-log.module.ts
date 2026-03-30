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
 * ## 사용 방법
 *
 * ### 방법 1: 인터셉터 사용 (권장)
 * ```typescript
 * import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
 * import { LogType } from 'src/modules/audit-log/domain';
 *
 * @AuditLog({
 *   type: LogType.AUTH,
 *   action: 'LOGIN',
 * })
 * async execute({ user, clientInfo }: LoginParams): Promise<void> {
 *   // 로그인 로직
 * }
 * ```
 *
 * ### 방법 2: 서비스 직접 사용
 * ```typescript
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
import { AuditLogAdapter } from './infrastructure/audit-log.adapter';
import { CriticalLogProcessor } from './infrastructure/processors/critical-log.processor';
import { HeavyLogProcessor } from './infrastructure/processors/heavy-log.processor';
import { DispatchLogService } from './application/dispatch-log.service';
import { AuditLogInterceptor } from './infrastructure/audit-log.interceptor';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { AUDIT_LOG_REPOSITORY } from './ports/out';
import { SnowflakeModule } from 'src/infrastructure/snowflake/snowflake.module';
import { BullMqModule } from 'src/infrastructure/bullmq/bullmq.module';
import { BullModule } from '@nestjs/bullmq';
import { AUDIT_QUEUES } from './infrastructure/audit-log.bullmq';

@Module({
  imports: [
    PrismaModule,
    SnowflakeModule,
    BullMqModule,
    BullModule.registerQueue(AUDIT_QUEUES.CRITICAL),
    BullModule.registerQueue(AUDIT_QUEUES.HEAVY),
  ],
  providers: [
    {
      provide: AUDIT_LOG_REPOSITORY,
      useClass: AuditLogAdapter,
    },
    CriticalLogProcessor,
    HeavyLogProcessor,
    DispatchLogService,
    AuditLogInterceptor,
  ],
  exports: [AUDIT_LOG_REPOSITORY, DispatchLogService, AuditLogInterceptor],
})
export class AuditLogModule {}
