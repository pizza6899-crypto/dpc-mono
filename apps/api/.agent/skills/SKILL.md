---
name: api_development_master
description: The main control tower for API development skills, coordinating database access, controller standards, and third-party integrations.
metadata:
  version: "2.0"
  type: "meta-skill"
---

# 🕹️ API Development Skills Control Tower

## Overview
This skill acts as the central hub for the API development workflow. It directs the AI agent to specific specialized skills based on the task at hand. Instead of guessing implementation details, the agent MUST refer to the specific sub-skill guides listed below.

## Instructions

When encountering a task related to the following categories, you MUST load the corresponding skill file instructions using `view_file`.

### 1. Database & ORM
**When to use:** creating or modifying database schemas, writing complex SQL queries, or handling transactions.

#### 1-A. Prisma Schema Design
*   **Skill Name:** `prisma_schema_guide`
*   **Path:** `apps/api/.agent/skills/prisma-schema-guide/SKILL.md`
*   **Key Rules:**
    *   ID Strategy: All BigInt, mapping to `snake_case` in DB.
    *   No Optimistic Lock fields; use Decimal(32, 18) for currency.

#### 1-B. Prisma Workflow & Transaction
*   **Skill Name:** `prisma_schema_management`
*   **Path:** `apps/api/.agent/skills/prisma/SKILL.md`
*   **Key Rules:**
    *   Multi-file schema management (`apps/api/prisma/schema/*.prisma`).
    *   Use `@InjectTransaction()` for transaction proxy.

#### 1-C. Complex Queries (Kysely)
*   **Skill Name:** `kysely_implementation`
*   *Path:** `apps/api/.agent/skills/kysely/SKILL.md`
*   **Key Rules:**
    *   Use **Kysely** for complex queries, **Prisma** for simple CRUD.

### 2. NestJS Architecture & Module Standards
**When to use:** creating a new module, refactoring existing modules, or deciding where to place business logic.
*   **Skill Name:** `hexagonal-module-standard`
*   **Path:** `apps/api/.agent/skills/hexagonal-module-standard/SKILL.md`
*   **Key Rules:** 5-layer separation, Rich Domain Entities, DIP via Ports.

### 2-A. NestJS Controller Standard
**When to use:** implementing controllers, designing APIs, or handling DTOs and ID obfuscation.
*   **Skill Name:** `controller-standard`
*   **Path:** `apps/api/.agent/skills/controller-standard/SKILL.md`
*   **Key Rules:** User/Admin separation, Sqids ID obfuscation, AuditLog, Swagger standards.

### 3. Casino Aggregator Integrations
**When to use:** integrating with external casino providers (DCS, Whitecliff).

#### DCS (DCS Aggregator)
*   **Skill Name:** `dcs_aggregator_integration`
*   **Path:** `apps/api/.agent/skills/dcs/SKILL.md`
*   **Context:** Refer to "DCS Seamless wallet API document V1.40.pdf".

#### Whitecliff
*   **Skill Name:** `whitecliff_aggregator_integration`
*   **Path:** `apps/api/.agent/skills/whitecliff/SKILL.md`
*   **Context:** Refer to "WHITECLIFF_en.html".

### 4. Core Infrastructure
**When to use:** Handling distributed node IDs, concurrency control, schedulers, or Snowflake ID generation.

#### Concurrency & Locking
*   **Skill Name:** `concurrency_control`
*   **Path:** `apps/api/.agent/skills/concurrency/SKILL.md`
*   **Key Rules:**
    *   Use **Advisory Lock** for short business logic.
    *   Use **Global Lock** table for long-running tasks.

#### Scheduler (Cron Job)
*   **Skill Name:** `scheduler-implementation`
*   **Path:** `apps/api/.agent/skills/scheduler-implementation/SKILL.md`
*   **Key Rules:**
    *   Use Table-based **GlobalLock** for distributed safety.
    *   Implement Zombie Lock recovery and history logging.

#### Node Identity & Snowflake
*   **Skill Name**: `distributed_infrastructure` (Node ID)
*   **Skill Name**: `snowflake_id_generation` (ID Generation)
*   **Path**: `apps/api/.agent/skills/snowflake/SKILL.md`
*   **Key Rules**:
    *   Instances must have unique node IDs (0-1023) for Snowflake generation.
    *   Snowflake generation MUST throw `SnowflakeClockBackwardsException` on time retrograde.

#### BullMQ Worker
*   **Skill Name:** `bullmq-worker-standard`
*   **Path:** `apps/api/.agent/skills/bullmq-worker-standard/SKILL.md`
*   **Key Rules:**
    *   Inherit `BaseProcessor` for all workers.
    *   Define queues in `bullmq.constants.ts`.
    *   Use connection sharing config and handle truncated logging.

### 5. Development Workflow
**When to use:** committing changes or following project collaboration rules.
*   **Skill Name:** `git-commit-guide`
*   **Path:** `apps/api/.agent/skills/git-commit-guide/SKILL.md`
*   **Key Rules:**
    *   Follow **Conventional Commits** specification.
    *   Use **Korean** for commit subjects and descriptions.
    *   Include detailed information in the body if the change is complex.

### 6. Meta-Skills (Internal)
**When to use:** Creating or managing skills for the agent.
*   **Skill Name:** `skill_creator`
*   **Path:** `apps/api/.agent/skills/skill-creator/SKILL.md`

### 7. Skill Management (General)

## Usage Workflow

1.  **Analyze Task**: Determine the domain (DB, API, Infrastructure, etc.).
2.  **Load Sub-skill**: Use `view_file` to read the specific `SKILL.md` identified above.
3.  **Execute**: Follow the detailed instructions within that sub-skill.
