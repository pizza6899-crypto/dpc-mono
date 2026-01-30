---
name: distributed_infrastructure
description: Core services for distributed environments (Node ID, Global Lock, Snowflake).
---

# 🌐 Distributed Infrastructure

## 1. Node Identity (`NodeIdentityService`)
- **Purpose**: Assigns unique `nodeId` (0-1023) to each instance using Redis.
- **Key Method**: `getNodeId()`, `getDisplayId()`.
- **Principle**: Atomic assignment via Lua script + 30s TTL Heartbeat.

## 2. Global Lock (`ConcurrencyService`)
- **Purpose**: Distributed locking using PostgreSQL `global_locks` table.
- **Key Method**: `runExclusive(key, task)`, `tryAcquire(key)`.
- **Principle**: Supports "Zombie Lock" recovery via `timeout_seconds`.

## 3. ID Generation (`SnowflakeService`)
- **Purpose**: 64-bit time-ordered unique ID generation.
- **Key Method**: `generate()`, `parse(id)`.
- **Principle**: Uses `nodeId` from `NodeIdentityService`.

## 4. Caching Strategy (`CacheService`)
- **Purpose**: Multi-layer caching (Memory L1, Redis L2) for performance and consistency.
- **Key Method**: `wrap(key, fetcher, ttl, store)`, `get(key, store)`, `set(key, value, ttl, store)`.
- **Strategy**: 
    - **Memory (L1)**: For frequently accessed, rarely changed data (e.g., configurations, tiers). Minimal latency.
    - **Redis (L2)**: For frequently changed/shared data across instances (e.g., user status, session info).
- **Architecture Distinction**:
    - `CacheService`: High-level caching logic (Memory vs Redis, serialization).
    - `RedisService`: Low-level Redis commands (Atomic counter, Lua script, Lock).
- **Cache-Aside Pattern**: Always use `wrap()` to ensure atomic "Check-Fetch-Store" logic.
