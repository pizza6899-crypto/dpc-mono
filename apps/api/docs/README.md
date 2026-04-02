---
project: apps/api docs
version: 1.0
lastUpdated: 2026-04-03
---

# API Docs Index

위치는 `apps/api/docs/` 입니다. 주요 문서:

- `SWAGGER_RULES.md` — 프로젝트 공통 스웨거 규칙
- `ARTIFACT_SWAGGER_DRAFT.md` — 모듈 초안 인덱스 (artifact)
- `artifact/` — 모듈별 문서 폴더 (CONTROLLERS.md, REQUEST_DTOS.md, RESPONSE_DTOS.md)
- `infrastructure/` — 인프라 모듈 참조 문서 폴더

사용 가이드
- 모듈별 문서를 생성/수정할 때는 `artifact`와 같은 모듈 폴더를 만들고 `CONTROLLERS.md`, `REQUEST_DTOS.md`, `RESPONSE_DTOS.md`를 유지하세요.
- 인프라 모듈 문서는 `infrastructure/` 하위에 배치하고, 모듈 단위로 개별 Markdown 파일을 추가하세요.
- 공통 규칙 변경 시 `SWAGGER_RULES.md`를 업데이트하고 팀 리뷰를 진행하세요.

인프라 문서
- [infrastructure/README.md](infrastructure/README.md) — 인프라 문서 인덱스
