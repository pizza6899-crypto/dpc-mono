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
*   **Skill Name:** `kysely_implementation`
*   **Path:** `apps/api/.agent/skills/kysely/SKILL.md`
*   **Key Rules:**
    *   Use **Kysely** for complex queries, **Prisma** for simple CRUD.
    *   Always use `nestjs-cls` for transaction management (`@InjectTransaction()`).

### 2. NestJS Controllers & API Design
**When to use:** creating new endpoints, defining DTOs, or implementing controllers.
*   **Skill Name:** `controller_skill`
*   **Path:** `apps/api/.agent/skills/controller/SKILL.md`
*   **Key Rules:**
    *   Strict separation between User and Admin APIs.
    *   User IDs must be obfuscated using Sqids; Admin APIs use raw IDs.
    *   Response DTOs must use `@Expose()` and `plainToInstance`.

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

### 4. Skill Management
**When to use:** Creating new skills or scaffolding standardized folder structures for the agent.
*   **Skill Name:** `skill_creator`
*   **Path:** `apps/api/.agent/skills/skill-creator/SKILL.md`
*   **Action:** Triggers the scaffolding process for a new `SKILL.md` and directory structure.

## Usage Workflow

1.  **Analyze Task**: Determine the domain (DB, API, Integration, Meta).
2.  **Load Sub-skill**: Use `view_file` to read the specific `SKILL.md` identified above.
3.  **Execute**: Follow the detailed instructions within that sub-skill.
