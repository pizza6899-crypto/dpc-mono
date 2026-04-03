---
module: infrastructure
version: 1.0
lastUpdated: 2026-04-03
lastReviewed: 2026-04-03
docType: infrastructure-index
audience:
  - ai-agent
  - human
docStatus: canonical
topics:
  - infrastructure
  - module-index
  - reference-routing
tasks:
  - choose-starting-document
  - route-infrastructure-question
  - find-related-module-doc
relatedDocs:
  - ../README.md
  - BULLMQ.md
  - CACHE.md
  - CLS.md
  - CONCURRENCY.md
  - ENV.md
  - PERSISTENCE.md
  - PRISMA.md
  - SNOWFLAKE.md
  - SQIDS.md
  - THROTTLE.md
  - WEBSOCKET.md
trustLevel: high
owner: infrastructure-docs
reviewResponsibility:
  - update when infrastructure document set, canonical module docs, or file names change
  - update when cross-module reading order or routing guidance changes
  - update when this index no longer matches actual infrastructure boundaries under sourceRoots
sourceRoots:
  - ../../src/infrastructure
---

# Infrastructure Docs

위치는 `apps/api/docs/infrastructure/` 입니다.

이 인덱스를 먼저 읽어야 하는 질문
- 어느 인프라 문서를 먼저 읽어야 하는가?
- 트랜잭션, 캐시, 락, WebSocket, 환경 설정 중 지금 문제와 가장 가까운 시작 문서는 무엇인가?
- 여러 인프라 문서를 함께 읽어야 한다면 어떤 문서를 조합해서 봐야 하는가?

문서 목록
- [BULLMQ.md](BULLMQ.md) — BullMQ 인프라 모듈 구조, 런타임 흐름, 작성 패턴
- [CACHE.md](CACHE.md) — Cache 인프라 모듈 구조, 저장소 전략, 사용 패턴
- [CLS.md](CLS.md) — CLS 요청 컨텍스트 모듈 구조, 트랜잭션 연동, 컨텍스트 접근 패턴
- [CONCURRENCY.md](CONCURRENCY.md) — 동시성 제어 인프라 구조, Advisory Lock/Global Lock 전략, 사용 패턴
- [ENV.md](ENV.md) — 환경 설정 인프라 구조, Config 로딩/타입 facade, 사용 패턴과 주의점
- [PERSISTENCE.md](PERSISTENCE.md) — 영속성 경계 타입 변환 유틸 구조, Cast/PersistenceOf 규칙, 사용 패턴
- [PRISMA.md](PRISMA.md) — Prisma 인프라 구조, CLS 트랜잭션 프록시, 직접 PrismaService 사용 기준
- [SNOWFLAKE.md](SNOWFLAKE.md) — Snowflake ID 생성 모듈 구조, 내부/외부 시각 생성 로직, parse 활용 패턴
- [SQIDS.md](SQIDS.md) — Sqids 인프라 구조, prefix 기반 외부 ID 난독화, 엄격한 decode 경계
- [THROTTLE.md](THROTTLE.md) — 요청 제한 인프라 구조, Guard/Service 이중 사용 패턴, Redis 카운터 동작
- [WEBSOCKET.md](WEBSOCKET.md) — WebSocket 인프라 구조, 네임스페이스/룸 설계, 세션/훅/실시간 이벤트 흐름

운영 원칙
- 인프라 공통 모듈 문서는 이 폴더 아래에 모듈 단위로 추가합니다.
- 모든 인프라 문서는 공통 frontmatter를 유지해 AI 에이전트가 문서 유형, 주제, 작업 적합도, 관련 문서를 빠르게 판별할 수 있게 합니다.
- 문서에는 구현 파일 구조, 런타임 흐름, 실제 사용 패턴, 작업 체크리스트를 함께 기록합니다.