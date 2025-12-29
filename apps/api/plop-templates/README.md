# Plop 템플릿 사용 가이드

이 프로젝트는 Plop을 사용하여 헥사고날 아키텍처 기반 NestJS 모듈의 보일러플레이트 코드를 자동 생성합니다.

## 사용 방법

### 1. 전체 모듈 생성 (추천)

헥사고날 아키텍처 구조의 전체 모듈을 한 번에 생성합니다.

```bash
cd apps/api
pnpm generate
# 또는
pnpm run generate
```

선택: `module` → 모듈 이름 입력 → 옵션 선택

**생성되는 구조:**
```
src/modules/{parentPath}/{moduleName}/
├── {moduleName}.module.ts          # NestJS 모듈
├── domain/
│   ├── index.ts                   # Public API
│   ├── model/
│   │   └── {moduleName}.entity.ts # 도메인 엔티티
│   ├── {moduleName}-policy.ts     # 도메인 정책
│   └── {moduleName}.exception.ts # 도메인 예외
├── application/
│   └── create-{moduleName}.service.ts # Use Case Service
├── infrastructure/
│   ├── {moduleName}.repository.ts    # Repository 구현
│   └── {moduleName}.mapper.ts        # Domain ↔ Prisma 변환
├── ports/
│   └── out/
│       ├── {moduleName}.repository.port.ts  # Repository 인터페이스
│       └── {moduleName}.repository.token.ts # DI Token
└── controllers/ (선택)
    └── {moduleName}.controller.ts
```

### 2. Application Service 생성

기존 모듈에 새로운 Use Case Service를 추가합니다.

```bash
pnpm generate
# 선택: service
# Service 이름: create-order, find-user-by-id 등
# 모듈 경로: affiliate/referral, auth/credential 등
```

### 3. Controller 생성

User 또는 Admin Controller를 생성합니다.

```bash
pnpm generate
# 선택: controller
# Controller 이름: user, admin-user 등
# 모듈 경로: affiliate/referral 등
# Controller 타입: user, admin, both
```

### 4. Domain Entity 생성

도메인 엔티티를 생성합니다.

```bash
pnpm generate
# 선택: entity
# Entity 이름: user, order 등
# 모듈 경로: affiliate/referral 등
```

## 예시

### 예시 1: affiliate 하위에 order 모듈 생성

```bash
pnpm generate
# 1. module 선택
# 2. 모듈 이름: order
# 3. 부모 경로: affiliate
# 4. 모든 옵션 yes
```

결과: `src/modules/affiliate/order/` 디렉토리와 모든 파일 생성

### 예시 2: 루트에 notification 모듈 생성

```bash
pnpm generate
# 1. module 선택
# 2. 모듈 이름: notification
# 3. 부모 경로: (비워두기)
# 4. 옵션 선택
```

결과: `src/modules/notification/` 디렉토리와 모든 파일 생성

## 템플릿 커스터마이징

템플릿 파일은 `plop-templates/` 디렉토리에 있습니다:
- `module/` - 모듈 템플릿
- `domain/` - 도메인 레이어 템플릿
- `application/` - 애플리케이션 레이어 템플릿
- `infrastructure/` - 인프라 레이어 템플릿
- `ports/` - 포트 템플릿
- `controller/` - 컨트롤러 템플릿

템플릿을 수정하여 프로젝트에 맞게 커스터마이징할 수 있습니다.

## 참고

- 생성된 파일에는 `TODO` 주석이 포함되어 있어 구현이 필요한 부분을 표시합니다
- 템플릿은 프로젝트의 기존 구조를 기반으로 작성되었습니다
- 필요에 따라 템플릿을 수정하여 사용하세요

