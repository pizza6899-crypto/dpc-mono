---
description: DPC 백엔드 프로젝트 기술 스택 및 라이브러리 사용 가이드
globs: **/*.ts
---

# 기술 스택 가이드

## 핵심 기술

- **Node.js** + **TypeScript** v5.7.3 (ES2023, NodeNext)
- **NestJS** v11.0.1

## 데이터베이스

- **Prisma** v6.14.0
  - ✅ Infrastructure 레이어에서만 사용
  - ✅ `@InjectTransaction()`으로 트랜잭션 관리 (PrismaService 직접 주입 금지)
  - ✅ Prisma.Decimal 연산: `.add()`, `.sub()`, `.mul()`, `.div()` 사용 (연산자 금지)
  - ✅ Domain 레이어: Prisma.Decimal과 Prisma enum 타입만 허용

## 인프라

- **Redis** (`ioredis` v5.8.2): 세션, 캐싱, 분산 락, Socket.io 어댑터
- **BullMQ** v5.65.1: 비동기 작업 큐
- **Socket.io** v4.8.1: 웹소켓 통신 (Redis 어댑터 사용)
- **CLS** (`nestjs-cls` v6.1.0): 트랜잭션 관리 (`@Transactional()`, `@InjectTransaction()`)

## 인증 및 보안

- **Passport**: JWT, Local, Google OAuth
- **Helmet** v8.1.0: HTTP 헤더 보안
- **Bcrypt** v6.0.0: 비밀번호 해싱
- **Express Session** + Redis Store: 세션 관리

## 문서화

- **Swagger** (`@nestjs/swagger` v11.2.3): REST API (`/api`)
- **AsyncAPI** (`nestjs-asyncapi` v1.4.0): WebSocket 이벤트 (`/async`)

## 유틸리티

- **Pino** (`nestjs-pino` v4.4.0): 로깅
- **Luxon** v3.7.1: 날짜/시간 처리
- **CUID2** v2.2.2: 비즈니스 식별자 (uid)
- **Axios** v1.11.0: HTTP 클라이언트
- **Nodemailer** v7.0.11: 이메일 발송
- **class-validator** + **class-transformer**: DTO 검증 및 변환

## 개발 도구

- **Jest** v30.0.0: 테스트 (단위: `*.spec.ts`, 통합: `test/integration/`, E2E: `test/`)
- **ESLint** v9.18.0 + **Prettier** v3.4.2: 코드 품질
- **Nest Commander** v3.18.0: CLI 도구

## 주요 스크립트

```bash
npm run start:dev        # 개발 모드
npm run build            # 빌드
npm run test             # 단위 테스트
npm run test:integration # 통합 테스트
npm run test:e2e         # E2E 테스트
npm run format           # 포맷팅
npm run lint             # 린팅
npm run seed             # 시드 데이터
```

## 관련 문서

- [경량 헥사고날 아키텍처 가이드](./lightweight-hexagonal-architecture.md)
- [테스트 작성 가이드](./testing-guide.md)
- [Socket.io AsyncAPI 가이드](./socket-io-asyncapi.md)

