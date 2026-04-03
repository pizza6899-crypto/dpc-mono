---
module: api-docs-root
project: apps/api docs
version: 1.1
lastUpdated: 2026-04-03
lastReviewed: 2026-04-03
docType: root-index
audience:
  - ai-agent
  - human
docStatus: canonical
topics:
  - docs-index
  - reference-routing
  - infrastructure
  - artifact
  - rules
tasks:
  - choose-starting-document
  - route-question
  - find-canonical-doc
relatedDocs:
  - infrastructure/README.md
  - artifact/README.md
  - SWAGGER_RULES.md
  - DOMAIN_ERRORS.md
trustLevel: high
owner: api-docs-root
reviewResponsibility:
	- update when canonical document links or folder entrypoints change
	- update when docs metadata schema or authority rules change
	- update when new top-level docs categories are added or removed
sourceRoots:
  - .
  - artifact
  - infrastructure
---

# API Docs Index

이 문서는 `apps/api/docs/` 전체의 루트 인덱스이자, AI 에이전트가 작업 시작 전에 가장 먼저 확인해야 하는 진입 문서입니다.

목적
- 질문 유형별로 어떤 문서를 먼저 읽어야 하는지 빠르게 결정합니다.
- 현재 어떤 문서가 기준 문서(canonical)인지 명확히 표시합니다.
- 코드 검색 전에 필요한 배경지식을 최소 비용으로 찾게 합니다.

AI 에이전트 사용 원칙
- 먼저 이 문서에서 작업 유형에 맞는 시작 문서를 고릅니다.
- 다음으로 해당 하위 인덱스나 상세 문서를 읽고, 그 뒤에 실제 소스 파일로 내려갑니다.
- 문서와 코드가 충돌하면 코드를 우선하고, 문서 드리프트를 함께 보고합니다.
- 초안이나 이동 안내 문서는 보조 정보로만 보고, 기준 문서를 우선 사용합니다.

문서 권위/유지보수 메타 규칙
- `docStatus: canonical` — 해당 주제의 기준 문서입니다. 같은 주제를 다루는 다른 문서보다 우선해서 사용합니다.
- `docStatus: reference` — 빠른 참조/요약 문서입니다. 최종 사실 확인은 canonical 문서나 코드와 함께 해야 합니다.
- `docStatus: draft` — 검토 전 초안 문서입니다. 답변 근거로 사용할 때 보수적으로 취급하고, 코드/합의와 충돌하면 초안을 낮은 우선순위로 봅니다.
- `docStatus: generated` — 자동 생성 문서입니다. 구조 확인용으로 쓰고, 해석은 canonical 문서를 우선합니다.
- 같은 주제를 다룰 때 AI 에이전트는 기본적으로 `canonical > reference > draft > generated` 순으로 근거 우선순위를 둡니다.
- `owner`는 문서 내용을 실제로 책임지는 문서 군집 또는 모듈 경계를 나타냅니다.
- `reviewResponsibility`는 어떤 변경이 생기면 이 문서를 다시 점검해야 하는지 나타냅니다.

질문 유형별 시작 문서
- 트랜잭션, Prisma, 리포지토리, DB write path
	- [infrastructure/PRISMA.md](infrastructure/PRISMA.md)
	- 이어서 [infrastructure/CLS.md](infrastructure/CLS.md), [infrastructure/CONCURRENCY.md](infrastructure/CONCURRENCY.md)
- 요청 컨텍스트, 현재 사용자, trace ID, 컨텍스트 전파
	- [infrastructure/CLS.md](infrastructure/CLS.md)
	- 이어서 [infrastructure/PRISMA.md](infrastructure/PRISMA.md), [infrastructure/WEBSOCKET.md](infrastructure/WEBSOCKET.md), [infrastructure/BULLMQ.md](infrastructure/BULLMQ.md)
- 캐시, rate limit, Redis 기반 보호 로직
	- [infrastructure/CACHE.md](infrastructure/CACHE.md)
	- 이어서 [infrastructure/THROTTLE.md](infrastructure/THROTTLE.md), [infrastructure/BULLMQ.md](infrastructure/BULLMQ.md)
- 큐, 워커, 스케줄러, 비동기 잡
	- [infrastructure/BULLMQ.md](infrastructure/BULLMQ.md)
- WebSocket, namespace, room, connect hook, 서버 푸시
	- [infrastructure/WEBSOCKET.md](infrastructure/WEBSOCKET.md)
	- 이어서 [infrastructure/CLS.md](infrastructure/CLS.md)
- 환경 변수, ConfigModule, EnvService
	- [infrastructure/ENV.md](infrastructure/ENV.md)
- ID 생성, 외부 노출용 인코딩, 직렬화/역직렬화
	- [infrastructure/SQIDS.md](infrastructure/SQIDS.md)
	- [infrastructure/SNOWFLAKE.md](infrastructure/SNOWFLAKE.md)
	- [infrastructure/PERSISTENCE.md](infrastructure/PERSISTENCE.md)
- artifact 모듈 API surface, 엔드포인트, DTO 구조
	- [artifact/README.md](artifact/README.md)
	- 이어서 [artifact/CONTROLLERS.md](artifact/CONTROLLERS.md), [artifact/REQUEST_DTOS.md](artifact/REQUEST_DTOS.md), [artifact/RESPONSE_DTOS.md](artifact/RESPONSE_DTOS.md)
- Swagger 규칙, DTO 문서화 기준
	- [SWAGGER_RULES.md](SWAGGER_RULES.md)
- 도메인 예외, 에러 코드, HTTP 상태 매핑
	- [DOMAIN_ERRORS.md](DOMAIN_ERRORS.md)

기준 문서
- [infrastructure/README.md](infrastructure/README.md) — 인프라 문서의 공식 인덱스
- [SWAGGER_RULES.md](SWAGGER_RULES.md) — Swagger/DTO 문서화 기준
- [DOMAIN_ERRORS.md](DOMAIN_ERRORS.md) — 도메인 예외 작성 기준
- [artifact/README.md](artifact/README.md) — artifact 모듈 문서의 공식 인덱스
- [artifact/CONTROLLERS.md](artifact/CONTROLLERS.md) — artifact 모듈 컨트롤러 맵
- [artifact/REQUEST_DTOS.md](artifact/REQUEST_DTOS.md) — artifact 요청 DTO 기준
- [artifact/RESPONSE_DTOS.md](artifact/RESPONSE_DTOS.md) — artifact 응답 DTO 기준

문서 상태 가이드
- [SWAGGER_RULES.md](SWAGGER_RULES.md) — 현재 공통 규칙 기준 문서이지만, 문서 자체에 적힌 대로 팀 리뷰를 동반해 갱신해야 합니다.

폴더별 역할
- `infrastructure/` — 인프라 공통 모듈의 구현 중심 레퍼런스 문서 폴더입니다.
- `artifact/` — artifact 모듈의 API surface 문서 폴더이며, [artifact/README.md](artifact/README.md)를 시작점으로 사용합니다.
- 루트 파일들 — 여러 모듈에 공통으로 적용되는 규칙과 기준 문서를 둡니다.

작성 및 배치 원칙
- 인프라 공통 모듈 문서는 `infrastructure/` 하위에 모듈 단위로 배치합니다.
- 모듈 API 문서 폴더에는 가능하면 로컬 `README.md` 인덱스를 두고, 개요·읽는 순서·범위·관련 규칙을 먼저 안내합니다.
- artifact 모듈 문서는 `artifact/README.md`를 시작점으로 하고, 세부 문서는 `CONTROLLERS.md`, `REQUEST_DTOS.md`, `RESPONSE_DTOS.md`로 유지합니다.
- 공통 규칙 문서를 바꾸면 이 루트 인덱스의 기준 문서 목록도 함께 갱신합니다.
- 새 문서가 특정 질문 유형의 첫 진입점이 된다면, 이 문서의 “질문 유형별 시작 문서”에도 반드시 반영합니다.
