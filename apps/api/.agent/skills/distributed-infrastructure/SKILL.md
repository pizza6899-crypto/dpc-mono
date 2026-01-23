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
