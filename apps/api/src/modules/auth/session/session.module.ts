// src/modules/auth/session/session.module.ts
import { Module } from '@nestjs/common';
import { RedisModule } from 'src/infrastructure/redis/redis.module';
import { SessionAdminController } from './controllers/admin/session-admin.controller';
import { CreateSessionService } from './application/create-session.service';
import { ExpireSessionsBatchService } from './application/expire-sessions-batch.service';
import { ExpireUserSessionsService } from './application/expire-user-sessions.service';
import { ListSessionsService } from './application/list-sessions.service';
import { RevokeSessionService } from './application/revoke-session.service';
import { SessionPolicy } from './domain/policy';
import { SessionTrackerService } from './infrastructure/session-tracker.service';
import { UserSessionRepository } from './infrastructure/user-session.repository';
import { UserSessionMapper } from './infrastructure/user-session.mapper';
import {
  USER_SESSION_REPOSITORY,
} from './ports/out';
import { ExpireSessionsScheduler } from './schedulers/expire-sessions.scheduler';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { EnvModule } from 'src/common/env/env.module';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';

@Module({
  imports: [
    RedisModule, // SessionTrackerService가 RedisService 사용
    ConcurrencyModule, // ExpireSessionsScheduler가 ConcurrencyService 사용
    EnvModule, // ExpireSessionsScheduler가 EnvService 사용
    AuditLogModule, // Audit 로그 사용
  ],
  controllers: [
    SessionAdminController,
  ],
  providers: [
    // Application Services
    CreateSessionService,
    ExpireSessionsBatchService,
    ExpireUserSessionsService,
    ListSessionsService,
    RevokeSessionService,

    // Domain Policies
    SessionPolicy,

    // Schedulers
    ExpireSessionsScheduler,

    // Infrastructure
    SessionTrackerService,
    UserSessionMapper,
    {
      provide: USER_SESSION_REPOSITORY,
      useClass: UserSessionRepository,
    },
  ],
  exports: [
    CreateSessionService,
    ExpireSessionsBatchService,
    ExpireUserSessionsService,
    ListSessionsService,
    RevokeSessionService,
    SessionTrackerService,
    USER_SESSION_REPOSITORY, // SessionSerializer에서 사용
  ],
})
export class SessionModule {}

