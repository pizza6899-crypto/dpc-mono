---
module: artifact
version: 1.0
lastUpdated: 2026-04-03
lastReviewed: 2026-04-03
docType: module-index
audience:
  - ai-agent
  - human
docStatus: canonical
topics:
  - artifact
  - api-surface
  - controllers
  - request-dtos
  - response-dtos
tasks:
  - choose-starting-document
  - route-artifact-question
  - find-artifact-api-doc
relatedDocs:
  - ../README.md
  - CONTROLLERS.md
  - REQUEST_DTOS.md
  - RESPONSE_DTOS.md
  - ../SWAGGER_RULES.md
  - ../DOMAIN_ERRORS.md
trustLevel: medium
owner: artifact-module
reviewResponsibility:
  - review when artifact docs scope, reading order, or canonical child documents change
  - review when artifact controllers or DTO document set changes
  - review when this folder no longer matches the actual documented API surface boundary
sourceRoots:
  - ../../src/modules/artifact
---

# Artifact Module Docs

이 문서는 `apps/api/docs/artifact/`의 공식 인덱스이자, artifact 모듈 API 문서를 읽기 위한 시작점입니다.

목적
- artifact 모듈 문서의 현재 범위를 빠르게 파악합니다.
- 질문 유형에 따라 어떤 문서를 먼저 읽어야 하는지 안내합니다.
- AI 에이전트가 컨트롤러/요청 DTO/응답 DTO 문서를 최소 비용으로 선택하게 합니다.

운영 원칙
- artifact 문서는 공통 frontmatter를 유지해 AI 에이전트가 문서 역할, 주제, 질문 적합도, 관련 문서를 메타데이터만으로도 판별할 수 있게 합니다.

문서 지위
- `canonical` 문서입니다.
- artifact 모듈 API surface 문서군의 공식 시작점이며, 하위 reference 문서를 고르기 전에 먼저 읽어야 합니다.
- 하위 문서가 이 인덱스와 충돌하면 인덱스와 소스 코드를 함께 확인해 문서 드리프트를 정리해야 합니다.

artifact 모듈 개요
- 대상 소스 경로: `apps/api/src/modules/artifact`
- 현재 문서 범위: HTTP API surface 중심 정리
- 현재 포함 범위: 컨트롤러, 요청 DTO, 응답 DTO
- 현재 미포함 범위: application/service/domain/repository 내부 로직, persistence 세부 구현, 트랜잭션 설계

읽는 순서
1. artifact 모듈 전체 엔드포인트와 권한 구성이 궁금하면 [CONTROLLERS.md](CONTROLLERS.md)를 먼저 읽습니다.
2. 요청 필드, validation, query/pagination 규칙이 궁금하면 [REQUEST_DTOS.md](REQUEST_DTOS.md)를 읽습니다.
3. 응답 shape, nested DTO, 공개 응답 구조가 궁금하면 [RESPONSE_DTOS.md](RESPONSE_DTOS.md)를 읽습니다.
4. Swagger 데코레이터 규칙이나 문서화 기준이 필요하면 [../SWAGGER_RULES.md](../SWAGGER_RULES.md)를 함께 읽습니다.
5. 서비스 동작, 도메인 규칙, DB 처리 방식까지 필요하면 문서만으로 충분하지 않으므로 `apps/api/src/modules/artifact` 소스를 추가로 확인합니다.

문서 목록
- [CONTROLLERS.md](CONTROLLERS.md) — artifact 모듈의 엔드포인트, 베이스 경로, 권한, 요청/응답 매핑
- [REQUEST_DTOS.md](REQUEST_DTOS.md) — artifact 모듈 요청 DTO 필드, validation, pagination 규칙
- [RESPONSE_DTOS.md](RESPONSE_DTOS.md) — artifact 모듈 응답 DTO와 nested 응답 구조

질문 유형별 시작 문서
- 라우트 목록, 권한, 태그, 엔드포인트 흐름
  - [CONTROLLERS.md](CONTROLLERS.md)
- 요청 body/query/param 필드, 입력 제약, 예시
  - [REQUEST_DTOS.md](REQUEST_DTOS.md)
- 응답 스키마, 리스트 응답, nested DTO
  - [RESPONSE_DTOS.md](RESPONSE_DTOS.md)
- Swagger 데코레이터 일관성, 공통 문서화 규칙
  - [../SWAGGER_RULES.md](../SWAGGER_RULES.md)
- 도메인 예외/에러 코드 매핑
  - [../DOMAIN_ERRORS.md](../DOMAIN_ERRORS.md)

현재 범위 해석 주의
- 이 폴더는 artifact 모듈의 API surface 문서입니다.
- 비즈니스 로직의 실제 처리 순서나 트랜잭션 경계는 이 문서만으로 단정하지 말아야 합니다.
- 컨트롤러/DTO 문서와 실제 구현이 충돌하면 소스 코드를 우선합니다.

관련 규칙
- [../SWAGGER_RULES.md](../SWAGGER_RULES.md) — Swagger/DTO 문서화 기준
- [../DOMAIN_ERRORS.md](../DOMAIN_ERRORS.md) — 도메인 예외 작성 기준
- [../README.md](../README.md) — 전체 API docs 루트 인덱스