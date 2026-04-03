---
module: sqids
version: 1.0
lastUpdated: 2026-04-03
lastReviewed: 2026-04-03
docType: infrastructure-module
audience:
  - ai-agent
  - human
docStatus: canonical
topics:
  - sqids
  - obfuscation
  - external-ids
  - prefixes
  - encoding
tasks:
  - encode-external-id
  - decode-identifier
  - add-prefix
relatedDocs:
  - README.md
  - ENV.md
  - SNOWFLAKE.md
  - WEBSOCKET.md
trustLevel: medium
owner: infrastructure-sqids
reviewResponsibility:
  - review when prefix registry, alphabet/minLength config, or encode/decode contracts change
  - review when admin decode tooling or explicit prefix boundary rules change
  - review when immutable constants or shuffle/hash assumptions are touched
sourceRoots:
  - ../../src/infrastructure/sqids
---

# Sqids 인프라 모듈 가이드

경로: `apps/api/src/infrastructure/sqids`

간단 요약
- 목적: 내부 `bigint` 식별자를 외부에 노출 가능한 문자열 ID로 바꾸고, 다시 복원하는 공통 경계 모듈입니다.
- 핵심 책임: prefix 기반 네임스페이스 분리, 결정론적 alphabet 셔플, reversible 난독화, 엄격한 prefix 검증 디코딩, 운영용 자동 디코드 API 제공.
- 이 모듈은 단순 문자열 포맷터가 아니라, “외부 노출 ID 정책 + prefix 계약 + 복구 가능한 난독화 규칙”을 함께 담당합니다.

이 문서를 먼저 읽어야 하는 질문
- 어떤 리소스에 어떤 prefix를 써야 하는가?
- 응답 encode와 요청 decode는 어느 경계에서 수행해야 하는가?
- `decodeAuto()`는 어디까지 허용되고 일반 API에서는 왜 피해야 하는가?

소스 구성
- [../../src/infrastructure/sqids/sqids.constants.ts](../../src/infrastructure/sqids/sqids.constants.ts) — prefix 목록, delimiter, 불변 해시/셔플 상수와 알고리즘
- [../../src/infrastructure/sqids/sqids.service.ts](../../src/infrastructure/sqids/sqids.service.ts) — encode/decode/decodeAuto 핵심 서비스
- [../../src/infrastructure/sqids/sqids.exception.ts](../../src/infrastructure/sqids/sqids.exception.ts) — 잘못된 ID/형식 예외 정의
- [../../src/infrastructure/sqids/sqids.module.ts](../../src/infrastructure/sqids/sqids.module.ts) — 전역 모듈 등록과 `EnvModule` 연결
- [../../src/infrastructure/sqids/controllers/admin/sqids-admin.controller.ts](../../src/infrastructure/sqids/controllers/admin/sqids-admin.controller.ts) — 관리자용 자동 디코드 엔드포인트
- [../../src/infrastructure/sqids/controllers/admin/dto/request/decode-sqid.request.dto.ts](../../src/infrastructure/sqids/controllers/admin/dto/request/decode-sqid.request.dto.ts) — 디코드 요청 DTO
- [../../src/infrastructure/sqids/controllers/admin/dto/response/decode-sqid.response.dto.ts](../../src/infrastructure/sqids/controllers/admin/dto/response/decode-sqid.response.dto.ts) — 디코드 응답 DTO
- [../../src/infrastructure/sqids/sqids.service.spec.ts](../../src/infrastructure/sqids/sqids.service.spec.ts) — 핵심 인코딩/디코딩 테스트

관련 연동 지점
- [../../src/app.module.ts](../../src/app.module.ts) — `SqidsModule`을 앱 전역에 등록
- [../../src/infrastructure/env/env.config.ts](../../src/infrastructure/env/env.config.ts) — `SQIDS_ALPHABET`, `SQIDS_MIN_LENGTH` 로딩
- [../../src/infrastructure/env/env.service.ts](../../src/infrastructure/env/env.service.ts) — `EnvService.sqids` getter 제공
- [../../src/modules/file/domain/file-usage.policy.ts](../../src/modules/file/domain/file-usage.policy.ts) — 파일 사용 타입별 prefix 정책 중앙화
- [../../src/modules/auth/credential/controllers/user/user-auth.controller.ts](../../src/modules/auth/credential/controllers/user/user-auth.controller.ts) — 로그인/인증 상태 응답에서 USER ID 인코딩
- [../../src/modules/deposit/controllers/user/deposit.controller.ts](../../src/modules/deposit/controllers/user/deposit.controller.ts) — promotion/deposit ID decode/encode 경계
- [../../src/modules/banner/campaign/controllers/admin/banner-admin.controller.ts](../../src/modules/banner/campaign/controllers/admin/banner-admin.controller.ts) — 배너 이미지 파일 ID의 strict decode
- [../../src/modules/tier/profile/controllers/user/user-tier.controller.ts](../../src/modules/tier/profile/controllers/user/user-tier.controller.ts) — 다중 tier 관련 ID 인코딩

대표 사용처
- 외부 응답 ID 인코딩
  - [../../src/modules/auth/credential/controllers/user/user-auth.controller.ts](../../src/modules/auth/credential/controllers/user/user-auth.controller.ts)
  - [../../src/modules/tier/profile/controllers/user/user-tier.controller.ts](../../src/modules/tier/profile/controllers/user/user-tier.controller.ts)
- 요청 경계에서의 엄격한 prefix 디코딩
  - [../../src/modules/deposit/controllers/user/deposit.controller.ts](../../src/modules/deposit/controllers/user/deposit.controller.ts)
  - [../../src/modules/banner/campaign/controllers/admin/banner-admin.controller.ts](../../src/modules/banner/campaign/controllers/admin/banner-admin.controller.ts)
- 도메인 정책과 prefix 매핑 유지
  - [../../src/modules/file/domain/file-usage.policy.ts](../../src/modules/file/domain/file-usage.policy.ts)
- 운영/관리 도구용 자동 디코딩
  - [../../src/infrastructure/sqids/controllers/admin/sqids-admin.controller.ts](../../src/infrastructure/sqids/controllers/admin/sqids-admin.controller.ts)

관련 sibling 문서
- [ENV.md](ENV.md) — Sqids alphabet/minLength 설정의 실제 출처
- [SNOWFLAKE.md](SNOWFLAKE.md) — 같은 외부 ID 경계에서 다루는 생성형 식별자 문서
- [WEBSOCKET.md](WEBSOCKET.md) — 실시간 이벤트 payload에서 Sqids가 어떻게 노출되는지 확인할 수 있는 문서

한눈에 보는 구조
1. `EnvService.sqids`가 base alphabet과 minimum length를 제공합니다.
2. `SqidsService`는 prefix별 `Sqids` 인스턴스를 캐시합니다.
3. `encode()`는 내부 ID에 Knuth hash를 적용하고 64비트를 두 개의 32비트 숫자로 나눠 `sqids` 라이브러리로 인코딩합니다.
4. `decode()`는 prefix를 엄격히 검증한 뒤 역과정을 수행해 원본 `bigint`를 복원합니다.
5. `decodeAuto()`는 prefix를 자동 감지하지만, 성격상 운영/관리 경로에 더 적합합니다.

아키텍처 핵심 포인트

## 1. 같은 ID라도 prefix가 다르면 다른 문자열이 나온다
- `SqidsPrefix`별로 `shuffleAlphabet(baseAlphabet, prefix)` 결과가 달라집니다.
- 따라서 같은 내부 ID라도 `USER`, `FILE`, `DEPOSIT`처럼 prefix가 다르면 결과 문자열도 달라집니다.

실무 의미
- 이 모듈은 단일 encode 함수처럼 보이지만, 실제로는 prefix별 네임스페이스를 분리한 외부 ID 시스템입니다.

## 2. 이 모듈은 암호화가 아니라 reversible 난독화 경계다
- `encode()`는 Knuth multiplicative hash와 Sqids를 조합해 순차 ID의 추측 가능성을 낮춥니다.
- 하지만 복호화 가능한 설계이므로, 권한 검증이나 접근 제어를 대신하지는 않습니다.

실무 의미
- “Sqid를 썼으니 안전하다”가 아니라, “직접적인 시퀀스 노출을 줄이고 prefix 계약으로 입력 검증을 강화한다”가 정확한 이해입니다.

## 3. 상수와 알고리즘은 사실상 데이터 마이그레이션 포인트다
- [../../src/infrastructure/sqids/sqids.constants.ts](../../src/infrastructure/sqids/sqids.constants.ts)에는 수정 금지 경고가 매우 강하게 들어가 있습니다.
- `KNUTH_PRIME`, `KNUTH_INVERSE`, `KNUTH_MASK`, `hashString()`, `mulberry32()`, `shuffleAlphabet()` 변경은 기존 외부 ID 전체를 깨뜨립니다.

실무 의미
- 이 파일은 “리팩터링 가능한 구현 세부”가 아니라, 운영 중인 외부 식별자 포맷 계약입니다.

## 4. 공개 API에서는 `decodeAuto()`보다 explicit prefix decode가 기본이다
- 실제 사용자/관리자 컨트롤러 경계에서는 대부분 `decode(value, SqidsPrefix.X)`로 엄격히 검증합니다.
- `decodeAuto()`는 [../../src/infrastructure/sqids/controllers/admin/sqids-admin.controller.ts](../../src/infrastructure/sqids/controllers/admin/sqids-admin.controller.ts) 같은 운영 도구에서만 합리적입니다.

실무 의미
- 일반 API 입력에서 `decodeAuto()`를 쓰면 잘못된 prefix를 더 늦게 발견하거나, 모듈 경계를 흐릴 수 있습니다.

## 5. prefix 레지스트리는 전역 계약이다
- `SqidsPrefix`는 단순 enum이 아니라, 전 모듈 외부 노출 ID의 공용 어휘집입니다.
- [../../src/modules/file/domain/file-usage.policy.ts](../../src/modules/file/domain/file-usage.policy.ts)처럼 다른 정책 계층도 이 값에 의존합니다.

실무 의미
- 새 prefix 추가는 해당 도메인만의 결정이 아니라, 전체 외부 식별자 체계에 합류하는 변경입니다.

파일별 상세 분석

## 1. `sqids.constants.ts`

역할
- prefix 체계, delimiter, 난독화 상수, prefix별 alphabet 셔플 알고리즘을 정의합니다.

핵심 요소
- `SQIDS_DELIMITER = '_'`
- `SqidsPrefix` — 3글자 고정 규칙 기반 prefix 레지스트리
- `KNUTH_PRIME`, `KNUTH_INVERSE`, `KNUTH_MASK` — reversible 해시 상수
- `DJB2_INIT_HASH`, `MULBERRY32_INCREMENT` — prefix별 alphabet 셔플 기반 상수
- `hashString()`, `mulberry32()`, `shuffleAlphabet()` — 결정론적 셔플 알고리즘

실무 의미
- 이 파일은 Sqids의 “룰북”이며, 다른 인프라 문서보다도 변경 안정성이 더 중요합니다.

## 2. `sqids.service.ts`

역할
- prefix별 Sqids 인스턴스를 관리하고, encode/decode/decodeAuto를 제공합니다.

### 생성자
- `EnvService.sqids`에서 `alphabet`, `minLength`를 읽습니다.

### `getSqidsInstance(prefix?)`
- prefix가 없으면 default key를 사용합니다.
- prefix가 있으면 해당 prefix로 alphabet을 셔플합니다.
- 생성된 `Sqids` 인스턴스는 `sqidsCache`에 저장해 재사용합니다.

의미
- prefix 종류 수만큼만 인스턴스가 늘어나므로, 캐시 크기는 작고 예측 가능합니다.

### `encode(id, prefix?)`
- `id <= 0`이면 `InvalidSqidIdException`
- Knuth hash 적용
- 64비트를 `high`, `low`로 분리
- `Sqids.encode([high, low])`
- prefix가 있으면 `${prefix}_${sqid}` 형식으로 반환

### `decode(sqid, prefix?)`
- prefix가 주어진 경우 먼저 접두사 형식을 검증합니다.
- `Sqids.decode()` 결과가 2개 미만이면 형식 예외를 던집니다.
- `high`, `low`를 다시 합친 뒤 `KNUTH_INVERSE`로 원본 ID를 복원합니다.

### `decodeAuto(sqid)`
- delimiter 기준으로 잠정 prefix를 분리합니다.
- `SqidsPrefix`에 등록된 값이면 해당 prefix 인스턴스로 디코드합니다.
- 아니면 prefix 없는 기본 Sqids로 처리합니다.

## 3. `sqids.exception.ts`

역할
- 잘못된 형식과 잘못된 원본 ID를 `DomainException`으로 노출합니다.

정의된 예외
- `InvalidSqidFormatException` — 잘못된 문자열 형식, prefix 불일치, 디코드 실패
- `InvalidSqidIdException` — 0 이하 ID 인코딩 시도

의미
- 이 모듈의 실패는 대부분 400 계열 입력 오류로 정리됩니다.

## 4. `sqids.module.ts`

역할
- `SqidsService`를 전역 모듈로 export 합니다.

구성
- `@Global()`
- `imports: [EnvModule]`
- controller: `SqidsAdminController`
- provider/export: `SqidsService`

의미
- 대부분의 기능 모듈은 별도 wiring 없이 `SqidsService`를 주입받아 사용할 수 있습니다.

## 5. `sqids-admin.controller.ts`

역할
- 운영/관리 상황에서 외부 ID 문자열을 원본 ID로 확인하는 관리자 엔드포인트입니다.

핵심 동작
- `POST /admin/sqids/decode`
- 관리자 권한 필요
- `decodeAuto()` 사용
- AuditLog 기록

중요 관찰
- `ApiOperation.description`의 예시 prefix 설명은 현재 `SqidsPrefix`의 실제 3글자 값과 일부 어긋나 있습니다.

실무 의미
- 이 컨트롤러는 운영 도구로는 유용하지만, 문서와 실제 prefix 레지스트리의 일치 여부를 주기적으로 확인해야 합니다.

## 6. `sqids.service.spec.ts`

검증하는 것
- 기본 encode/decode 동작
- `bigint` 처리
- zero/negative ID 예외
- prefix mismatch 예외
- 같은 ID라도 prefix에 따라 다른 문자열이 나오는지

현재 한계
- 모든 prefix를 exhaustive하게 검증하지는 않습니다.
- `decodeAuto()`의 세부 경계 케이스까지 깊게 다루지는 않습니다.

실제 사용 패턴 정리

## 1. 응답 DTO 직전에서 외부 ID로 encode 한다

대표 예시
- [../../src/modules/auth/credential/controllers/user/user-auth.controller.ts](../../src/modules/auth/credential/controllers/user/user-auth.controller.ts)
- [../../src/modules/tier/profile/controllers/user/user-tier.controller.ts](../../src/modules/tier/profile/controllers/user/user-tier.controller.ts)

패턴
- 서비스/도메인 내부에서는 원시 `bigint`를 유지합니다.
- 외부 응답을 만들 때만 `SqidsService.encode(..., prefix)`를 적용합니다.

## 2. 요청 입력은 경계에서 바로 decode 한다

대표 예시
- [../../src/modules/deposit/controllers/user/deposit.controller.ts](../../src/modules/deposit/controllers/user/deposit.controller.ts)
- [../../src/modules/banner/campaign/controllers/admin/banner-admin.controller.ts](../../src/modules/banner/campaign/controllers/admin/banner-admin.controller.ts)

패턴
- DTO나 path param으로 받은 문자열을 컨트롤러 경계에서 즉시 decode 합니다.
- prefix가 다르면 바로 예외를 던져 다른 도메인 ID가 섞이는 것을 막습니다.

## 3. 도메인 정책이 prefix를 추가로 고정하기도 한다

대표 예시
- [../../src/modules/file/domain/file-usage.policy.ts](../../src/modules/file/domain/file-usage.policy.ts)

패턴
- 특정 사용 타입은 어떤 prefix를 써야 하는지 별도 정책 객체에서 관리합니다.
- 즉, prefix는 표현 규칙이 아니라 도메인 정책과도 연결됩니다.

## 4. 운영 도구에서만 자동 감지를 허용한다

대표 예시
- [../../src/infrastructure/sqids/controllers/admin/sqids-admin.controller.ts](../../src/infrastructure/sqids/controllers/admin/sqids-admin.controller.ts)

패턴
- prefix가 섞여 들어올 수 있는 운영 화면/디버깅 도구에서는 `decodeAuto()`가 유용합니다.
- 일반 API 계약에서는 explicit prefix decode가 더 안전합니다.

중요 관찰 및 주의사항

## 1. 이 모듈의 핵심 상수와 알고리즘은 운영 중 절대 바꾸면 안 된다
- constants 파일의 경고는 과장이 아니라 실제 운영 호환성 규칙입니다.

## 2. `SQIDS_ALPHABET`, `SQIDS_MIN_LENGTH`도 단순 표현 옵션이 아니다
- 특히 `alphabet` 변경은 사실상 기존 외부 ID 포맷을 깨는 변경입니다.
- `minLength`도 외부 표면 형식을 바꾸므로 호환성을 검토해야 합니다.

## 3. 공개 API 입력에서 `decodeAuto()`를 기본값처럼 쓰면 안 된다
- 요청 계약이 분명할수록 `decode(value, expectedPrefix)`가 맞습니다.

## 4. `decode()` 결과는 `bigint`다
- 호출부가 이를 `number`처럼 다루면 큰 ID에서 손실이 생길 수 있습니다.

## 5. Sqids는 권한 체크를 대신하지 않는다
- prefix가 맞고 디코딩이 됐다고 해서 해당 리소스 접근 권한이 검증된 것은 아닙니다.

## 6. 현재 관리자 디코드 문서 설명과 실제 prefix 체계 사이에 드리프트가 있다
- 컨트롤러 설명은 일부 짧은 예시 prefix를 사용하지만, 실제 상수는 3글자 고정 체계입니다.

새 작업 시 체크리스트
1. 새 외부 노출 ID가 필요한지, 기존 prefix를 재사용할지 먼저 판단
2. 응답에서는 반드시 `encode(..., expectedPrefix)`를 사용
3. 입력에서는 가능하면 컨트롤러 경계에서 `decode(..., expectedPrefix)`를 즉시 수행
4. 운영 도구가 아니라면 `decodeAuto()` 사용을 피함
5. prefix를 새로 추가하면 constants, 테스트, 정책 문서, 사용처를 함께 갱신
6. `SQIDS_ALPHABET`, `SQIDS_MIN_LENGTH`, 불변 상수/알고리즘 변경은 마이그레이션급 변경으로 취급

요약 결론
- Sqids 모듈은 이 코드베이스의 외부 식별자 경계를 담당하는 핵심 인프라입니다.
- 가장 중요한 원칙은 세 가지입니다.
  - 외부 응답은 explicit prefix로 encode 한다.
  - 외부 입력은 explicit prefix로 decode 한다.
  - constants, algorithm, alphabet 규칙은 운영 호환성 계약으로 다룬다.
- 운영 편의용 `decodeAuto()`는 유용하지만, 일반 API 설계의 기본 경로로 쓰면 안 됩니다.
