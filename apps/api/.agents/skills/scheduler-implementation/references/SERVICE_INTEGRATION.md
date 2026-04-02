# Service Integration Best Practices

## Separation of Concerns
The Scheduler class should be lean. Its only responsibilities are:
1.  **Defining the Trigger**: `@Cron` frequency.
2.  **Environment Check**: Is it enabled?
3.  **Concurrency Control**: Global lock.
4.  **Context Setup**: `cls.run`.
5.  **Logging**: High-level progress.

### Wrong Implementation (Fat Scheduler)
```typescript
@Cron('0 0 * * *')
async handle() {
  const users = await this.db.user.findMany();
  for (const user of users) {
    // complex business logic here...
  }
}
```

### Right Implementation (Thin Scheduler)
```typescript
@Cron('0 0 * * *')
async handle() {
  // ... boilerplate (lock, env) ...
  await this.myService.processDailyBatch();
}
```

## Batch Processing
For tasks involving many records:
- **Chunking**: Don't load everything into memory. Use streaming or offset/limit batching.
- **Idempotency**: Ensure that if the task fails halfway and restarts, it doesn't duplicate work for already processed items.
- **Progress Tracking**: Log progress every X items to monitor long-running jobs.

## Error Handling
- **Individual Failures vs. Batch Failures**: If processing one item fails, it shouldn't necessarily stop the whole batch. Wrap individual item processing in its own `try-catch`.
- **Alerting**: Critical scheduler failures should be logged with a level that triggers alerts (e.g., `logger.error`).
