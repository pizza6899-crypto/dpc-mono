# Concurrency Strategy: Why Table-based GlobalLock?

## The Limitation of Advisory Locks

While `pg_advisory_xact_lock` is excellent for short-lived data integrity (e.g., wallet balance updates), it falls short for scheduler instance control due to:
- **Transaction Timeouts**: Long-running jobs crash when the transaction exceeds DB/Prisma timeouts.
- **Connection Stewardship**: Managing the lifecycle of a lock across a connection pool is error-prone.

## The Advantage of GlobalLock Table

The `GlobalLock` table serves as a persistent metadata store for your application's distributed activities.

1.  **Observability**: You can query the table to see exactly which instance (`instance_id`) started a task at what time (`locked_at`).
2.  **Configurability**: Different tasks can have different `timeout_seconds` defined per row, allowing flexible zombie-lock recovery.
3.  **Stability**: It uses millisecond-long transactions to acquire/release locks, keeping the database healthy (Vacuum-friendly).
4.  **Audit Trail**: The `last_status` and `error_message` fields provide an immediate history of the task's execution without digging through logs.

## When to use which?

| Goal | Mechanism | Duration |
| :--- | :--- | :--- |
| **Instance Control** (Don't run twice) | `GlobalLock` Table | Minutes to Hours |
| **Data Integrity** (Entry updates) | `pg_advisory_xact_lock` | Milliseconds to Seconds |
| **Rate Limiting** / **Cache** | Redis (ConcurrencyService) | Very Short |
