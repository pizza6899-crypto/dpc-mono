# GlobalLock Schema & DDL

## Model Definition (Prisma)

인프라 관련 스키마 파일인 `apps/api/prisma/schema/infra.prisma`에 정의되어 있습니다.

```prisma
model GlobalLock {
  key            String    @id                 // 예: 'scheduler:daily-settle', 'job:export-users'
  instanceId     String?   @map("instance_id") // 락을 점유한 인스턴스 ID (hostname 등)
  isAcquired     Boolean   @default(false) @map("is_acquired")
  
  lockedAt       DateTime? @map("locked_at")
  timeoutSeconds Int       @default(1800)      @map("timeout_seconds") // 좀비 락 판단 기준 (초)
  
  lastResult     String?   @map("last_status")   // SUCCESS, FAILED
  errorMessage   String?   @map("error_message") // 실패 시 에러 요약
  
  lastFinishedAt DateTime? @map("last_finished_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  @@map("global_locks")
}
```

## Atomic Acquisition Query

Prisma `$executeRaw`를 사용하여 다음과 같이 원자적으로 락을 점유합니다.

```typescript
const result = await this.prisma.$executeRaw`
  UPDATE "global_locks"
  SET "is_acquired" = true,
      "locked_at" = NOW(),
      "instance_id" = ${instanceId}
  WHERE "key" = ${lockKey}
    AND (
      "is_acquired" = false 
      OR "locked_at" < NOW() - (CAST("timeout_seconds" || ' seconds' AS INTERVAL))
    )
`;
```

### 쿼리 구성 요소 설명:
- **`is_acquired = false`**: 현재 아무도 락을 잡고 있지 않은 경우.
- **`locked_at < NOW() - INTERVAL`**: 서버 장애 등으로 인해 락이 해제되지 않은 경우, 설정된 `timeoutSeconds`가 지나면 자동으로 락을 회수(Steal)할 수 있도록 합니다.

## Monitoring Info
어드민 UI 등에서 다음 쿼리를 통해 현재 실행 중인 장기 작업들을 확인할 수 있습니다.
```sql
SELECT key, locked_at, instance_id 
FROM global_locks 
WHERE is_acquired = true;
```
