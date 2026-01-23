# Concurrency Management in Schedulers

## Why Concurrency Control?
In a production environment where multiple instances of the application are running (e.g., Kubernetes, PM2 Cluster Mode), a simple `@Cron` decorator will trigger the task on **every instance** simultaneously. This can lead to:
- Duplicate data processing
- Race conditions (e.g., double payments, double commissions)
- High database load

## Using ConcurrencyService
`ConcurrencyService` leverages Redis to provide a distributed locking mechanism.

### `acquireGlobalLock(key, options)`
- **key**: A unique identifier for the task. Use a consistent naming convention like `[module]:[task]:lock`.
- **options.ttl**: Time-To-Live in seconds. 
    - MUST be longer than the maximum expected execution time of the task.
    - If the process crashes, the lock will be released automatically after this time.
- **options.retryCount**: How many times to retry if the lock is held.
    - For most schedulers, `0` is recommended (skip if busy).

### Example Pattern
```typescript
const lock = await this.concurrencyService.acquireGlobalLock(
  'affiliate:settle-commissions',
  { ttl: 600, retryCount: 0 }
);

if (!lock) return;

try {
  // logic
} finally {
  await this.concurrencyService.releaseLock(lock);
}
```

## Considerations
- **Lock Deadlines**: If a task takes longer than the TTL, the lock expires and another instance might start the same task. Monitor task duration and adjust TTL or implement lock renewal.
- **Strict Atomicity**: For critical financial tasks, combine the global lock with database-level transactions or idempotency keys.
