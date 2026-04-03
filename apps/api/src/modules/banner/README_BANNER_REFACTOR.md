# Banner 모듈 리팩터링 / 번역(Translations) 분리 제안

작성일: 2026-04-03

요약
- 현재 `campaign` 하위의 `Create/Update` 서비스에서 `translations[]`(언어별 항목)과 파일 첨부, sqid 디코딩, URL 해상도 로직을 모두 한 번에 처리함.
- 이로 인해 단위 테스트·통합 테스트 작성이 어렵고, 트랜잭션 경계·오류 보상 로직이 혼재되어 유지보수가 힘듦.
- 권장: 단계적 분리(비파괴적 호환 레이어 유지)를 권장한다. 최종 목표는 `Banner`(메타)와 `BannerTranslation`(언어별 콘텐츠/이미지)을 책임 분리하는 것이다.

현행 코드 구조(요약)
- 위치: `apps/api/src/modules/banner/campaign/`
  - application: create/update/find/get/delete 서비스
  - controllers: admin/public 컨트롤러 + DTO
  - infrastructure: `banner.repository.ts`, `banner.mapper.ts`
  - ports: `banner.repository.port.ts`

문제점 정리
- 단일 핸들러에 책임 집중: 배너 메타 + 번역 + 파일 attach + sqid 처리 + URL 생성
- 테스트 난이도: 파일 attach/외부 서비스(파일 URL) 영향으로 유닛/통합 테스트 복잡
- 트랜잭션 경계 불명확: 배너 생성 성공 후 번역 attach 실패 시 보상 로직 필요
- 재사용성 저하: 동일한 파일/번역 로직을 다른 모듈이 재사용하기 어려움

옵션별 분석

옵션 1 — 유지(현행) : 최소 변경
- 장점: 빠르게 동작 유지, 클라이언트 변경 불필요
- 단점: 테스트·유지보수 문제 지속, 이후 기능 확장 비용 증가
- 권장 상황: 빠른 패치가 최우선이고 팀이 작으며 리팩터 위험을 피해야 할 때

옵션 2 — 단계적 추출(권장, 안전한 단계적 접근)
- 내용: `BannerTranslationService`/`BannerTranslationRepository`를 새로 만들고, 기존 `Create/Update`는 내부에서 이를 호출(동일 트랜잭션 내)하도록 위임.
- 장점:
  - 비파괴적: 기존 API 유지
  - 테스트 용이: 번역 로직(파일 attach 등)을 독립 테스트 가능
  - 점진적 전환: 관리자 번역 CRUD를 추가해 클라이언트 전환 유도 가능
- 단점: 초기 작업량(서비스·리포지토리 추가) 존재
- 구현 난이도: 중

옵션 3 — 완전 분리 (번역 별도 API + 비동기 동기화)
- 내용: 번역은 별도 엔드포인트(관리자 CRUD)로 완전 분리. 배너 생성 시 번역은 별도의 트랜잭션/큐(비동기)로 처리.
- 장점: 모듈 독립성 극대화, 장애 격리
- 단점: 클라이언트 변경 필요, 일관성(즉시 반영) 보장 위해 추가 설계 필요
- 구현 난이도: 높음

옵션 4 — 이벤트 기반/비동기 파일 처리 (첨부·URL 비동기화)
- 내용: 파일 첨부와 URL 생성은 비동기로 처리(예: 파일 업로드 후 큐로 attach 작업 실행), 배너는 즉시 생성되지만 번역의 imageUrl은 비동기 채움.
- 장점: 빠른 응답성, 파일 서비스 장애가 전체 흐름에 영향 적음
- 단점: UI/클라이언트에서 eventual consistency 처리 필요

데이터베이스·스키마 고려사항
- `banner_translations` 테이블 분리 권장 구조:
  - id (bigint)
  - banner_id (fk -> banner.id)
  - language (enum)
  - title, alt_text, link_url, image_file_id (nullable), image_url (nullable)
  - is_active, created_at, updated_at
  - unique(banner_id, language)
- 인덱스: `language`, `banner_id` 조합, 검색용 fulltext 또는 LIKE 색인 고려
- 외래키: 배너 삭제 정책(soft-delete)과 연동 고려 — translation은 배너 soft-delete와 함께 처리

트랜잭션·오류 정책 제안
- 동시성/원자성 요구가 크면(관리자 UI에서 즉시 반영 기대) — 배너 생성 + 번역 생성은 동일 DB 트랜잭션에서 처리
- 파일 attach(외부 스토리지) 실패 시:
  - 옵션 A: 전체 트랜잭션 롤백(원자성 우선)
  - 옵션 B: 배너 생성 성공, 번역은 상태 `PENDING`으로 두고 비동기 재시도(가용성 우선)
- 권장: 단계적 추출 시에는 기본적으로 동일 트랜잭션(안정성)으로 구현 후 필요 시 비동기 모델 도입

파일 첨부 & Sqids 처리 권고 변경
- 현재: 컨트롤러에서 sqid 디코딩이 부분적으로 이루어짐(파일·banner 혼재)
- 제안:
  - `AttachFileService`가 `usageType`을 받아 적절한 sqids prefix로 디코딩하도록 통합
  - 컨트롤러는 raw sqid 문자열을 전달만 하고, 서비스 계층에서 validation/decoding/attach 처리

테스트 전략
- 유닛: `BannerTranslationService` 단위 테스트 — sqid 디코딩, 파일 attach 실패/성공 케이스, imageUrl 매핑
- 통합: `CreateBannerService`와 `BannerTranslationService` 통합 테스트(트랜잭션 내 동작, 롤백 케이스)
- E2E: 관리자 API 흐름(번역 포함 생성/수정/삭제) 검증

마이그레이션·배포 단계 제안 (권장: 단계적)
1. `BannerTranslationService`/Repository 코드 작성 + DB migration 파일(테이블/제약/인덱스)
2. Create/Update 서비스 내부에서 새 TranslationService로 위임(동일 트랜잭션)
3. 단위/통합 테스트 작성·검증
4. 관리자 UI/클라이언트 동작 점검
5. (선택) 별도 번역 CRUD API 추가 후 클라이언트 점진 이전

최종 권장안(한 줄):
- "단계적 추출(옵션 2) — `BannerTranslationService`/Repository를 먼저 분리해 내부 위임하고 테스트를 강화한 뒤, 필요 시 완전한 API 분리 또는 비동기 처리를 도입"을 강력히 추천한다.

예상 작업 목록(우선순위)
1. `apps/api/src/modules/banner/campaign/ports/banner-translation.repository.port.ts` 정의
2. `BannerTranslationRepository` 구현(Prisma/tx 사용)
3. `BannerTranslationService` 구현(파일 attach, sqid 디코딩 위임 포함)
4. `CreateBannerService`/`UpdateBannerService`에서 위임하도록 변경(동일 트랜잭션)
5. 단위/통합 테스트 추가
6. 문서(README_BANNER_REFACTOR.md)에 절차 기록 및 마이그레이션 스크립트

추가 코멘트
- 빠른 추진을 원하면 제가 1–4번(골격 코드 + 간단 테스트 스텁)을 적용해 드릴 수 있습니다. 원하시면 우선 `BannerTranslationService` 골격부터 만들어 진행하겠습니다.

---
파일 작성: 자동 생성된 개발 안내서. 실제 코드 변경 시 위 단계를 따라 점진 적용하세요.
