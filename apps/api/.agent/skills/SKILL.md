---
name: api_development_master
description: API 서버 개발 기술 가이드 관제탑
---

# 🕹️ API Development Skills Control Tower

## 📚 Guides

### 1. Database (Prisma & Kysely)
복잡한 쿼리는 Kysely, 단순 CRUD는 Prisma를 사용합니다.
- **Guide:** `view_file apps/api/.agent/skills/kysely/SKILL.md`
- **Rule:** `nestjs-cls` 트랜잭션(`@InjectTransaction()`) 내에서 `this.tx.$kysely` 사용

### 2. Controller & API
일관된 컨트롤러 구현을 위한 표준 지침 (User/Admin 분리, DTO, ID 난독화 등).
- **Guide:** `view_file apps/api/.agent/skills/controller/SKILL.md`
- **Rule:** Admin은 Raw ID, User는 Sqids 사용 / `@ApiTags` 영어 사용 / `@AuditLog` 필수

### 3. Casino Aggregators
외부 카지노 플랫폼 연동을 위한 전용 콜백 처리 및 보안 지침.
- **DCS Guide:** `view_file apps/api/.agent/skills/dcs/SKILL.md` (참조: DCS Seamless wallet API document V1.40.pdf)
- **Whitecliff Guide:** `view_file apps/api/.agent/skills/whitecliff/SKILL.md` (참조: WHITECLIFF_en.html)

## 🚀 Usage
기능 구현 전 관련 가이드 파일을 확인하십시오.
