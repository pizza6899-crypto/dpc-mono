# Session Module 네이밍 점검 결과

## ✅ 적절한 네이밍

### 1. 도메인 레이어 (Domain)
- ✅ `domain/model/user-session.entity.ts` → `UserSession`
- ✅ `domain/model/device-info.vo.ts` → `DeviceInfo`
- ✅ `domain/model/session-type.enum.ts` → `SessionType`
- ✅ `domain/model/session-status.enum.ts` → `SessionStatus`
- ✅ `domain/policy.ts` → `SessionPolicy`
- ✅ `domain/exception.ts` → `MultipleLoginNotAllowedException`, `SessionNotFoundException`, `SessionOwnershipException`

### 2. 포트 레이어 (Ports)
- ✅ `ports/out/user-session.repository.port.ts` → `UserSessionRepositoryPort`
- ✅ `ports/out/user-session.repository.token.ts` → `USER_SESSION_REPOSITORY`
- ✅ `ports/out/index.ts` → 적절한 export

### 3. 인프라스트럭처 레이어 (Infrastructure)
- ✅ `infrastructure/user-session.repository.ts` → `UserSessionRepository`
- ✅ `infrastructure/user-session.mapper.ts` → `UserSessionMapper`

### 4. 애플리케이션 레이어 (Application)
- ✅ `application/create-session.service.ts` → `CreateSessionService`
- ✅ `application/list-sessions.service.ts` → `ListSessionsService`
- ✅ `application/revoke-session.service.ts` → `RevokeSessionService`
- ✅ `application/expire-sessions-batch.service.ts` → `ExpireSessionsBatchService`
- ✅ `application/expire-user-sessions.service.ts` → `ExpireUserSessionsService`

### 5. 컨트롤러 레이어 (Controllers)
- ✅ `controllers/admin/session-admin.controller.ts` → `SessionAdminController`
- ✅ DTO 파일명 및 클래스명 적절

### 6. 스케줄러 (Schedulers)
- ✅ `schedulers/expire-sessions.scheduler.ts` → `ExpireSessionsScheduler`

## ⚠️ 개선 권장 사항

### 1. `SessionTrackerService` 네이밍
**현재:**
- 파일: `infrastructure/session-tracker.service.ts`
- 클래스: `SessionTrackerService`

**문제점:**
- `SessionTrackerService`는 실제로 Redis와 WebSocket을 추상화하는 어댑터 역할을 합니다.
- 프로젝트의 다른 모듈에서는 어댑터를 `{Entity}Adapter`로 명명하는 경우가 있습니다 (예: `AuditLogAdapter`).
- 하지만 이 서비스는 단순 어댑터가 아니라 세션 추적 로직을 포함한 서비스이므로 현재 네이밍이 적절할 수 있습니다.

**권장사항:**
- 현재 네이밍 유지 (서비스 로직이 포함되어 있으므로)
- 또는 `SessionTrackingAdapter`로 변경 고려 (어댑터 역할이 더 강조되는 경우)

### 2. 포트 인터페이스 네이밍 일관성
**현재:**
- `UserSessionRepositoryPort` ✅

**비교:**
- 다른 모듈: `AffiliateCodeRepositoryPort`, `UserRepositoryPort`, `ReferralRepositoryPort`
- 모두 `{Entity}RepositoryPort` 패턴을 따르고 있어 일관성 있음 ✅

### 3. 토큰 네이밍 일관성
**현재:**
- `USER_SESSION_REPOSITORY` ✅

**비교:**
- 다른 모듈: `AFFILIATE_CODE_REPOSITORY`, `USER_REPOSITORY`
- 모두 `{ENTITY}_REPOSITORY` 패턴을 따르고 있어 일관성 있음 ✅

### 4. 매퍼 네이밍
**현재:**
- `UserSessionMapper` ✅

**비교:**
- 프로젝트 내 다른 매퍼가 없어 직접 비교는 어려우나, 일반적인 네이밍 컨벤션에 부합함 ✅

## 📋 전체 점검 요약

| 항목 | 파일명 | 클래스명 | 상태 |
|------|--------|----------|------|
| 엔티티 | `user-session.entity.ts` | `UserSession` | ✅ |
| 값 객체 | `device-info.vo.ts` | `DeviceInfo` | ✅ |
| Enum | `session-type.enum.ts` | `SessionType` | ✅ |
| Enum | `session-status.enum.ts` | `SessionStatus` | ✅ |
| 정책 | `policy.ts` | `SessionPolicy` | ✅ |
| 예외 | `exception.ts` | `*Exception` | ✅ |
| 포트 | `user-session.repository.port.ts` | `UserSessionRepositoryPort` | ✅ |
| 토큰 | `user-session.repository.token.ts` | `USER_SESSION_REPOSITORY` | ✅ |
| 리포지토리 | `user-session.repository.ts` | `UserSessionRepository` | ✅ |
| 매퍼 | `user-session.mapper.ts` | `UserSessionMapper` | ✅ |
| 서비스 | `create-session.service.ts` | `CreateSessionService` | ✅ |
| 서비스 | `list-sessions.service.ts` | `ListSessionsService` | ✅ |
| 서비스 | `revoke-session.service.ts` | `RevokeSessionService` | ✅ |
| 서비스 | `expire-sessions-batch.service.ts` | `ExpireSessionsBatchService` | ✅ |
| 서비스 | `expire-user-sessions.service.ts` | `ExpireUserSessionsService` | ✅ |
| 트래커 | `session-tracker.service.ts` | `SessionTrackerService` | ⚠️ (검토 필요) |
| 컨트롤러 | `session-admin.controller.ts` | `SessionAdminController` | ✅ |
| 스케줄러 | `expire-sessions.scheduler.ts` | `ExpireSessionsScheduler` | ✅ |

## 🎯 결론

**전체적으로 네이밍이 매우 적절하고 프로젝트의 컨벤션을 잘 따르고 있습니다.**

1. ✅ **포트/어댑터 패턴**: `{Entity}RepositoryPort` → `{Entity}Repository` 패턴 준수
2. ✅ **서비스 네이밍**: `{Action}{Entity}Service` 패턴 준수
3. ✅ **파일명**: kebab-case 사용, 클래스명과 일치
4. ✅ **일관성**: 다른 모듈과 동일한 네이밍 컨벤션 준수

**유일한 검토 사항:**
- `SessionTrackerService`는 현재 네이밍이 적절하지만, 어댑터 역할이 더 강조된다면 `SessionTrackingAdapter`로 변경을 고려할 수 있습니다. 다만 현재는 서비스 로직이 포함되어 있어 `Service` 네이밍이 더 적절해 보입니다.

