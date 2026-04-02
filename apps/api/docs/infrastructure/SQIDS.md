# Sqids 모듈 가이드

경로: `apps/api/src/infrastructure/sqids`

간단 요약
- 목적: 내부 정수 ID(예: DB의 시퀀스)를 외부에 노출 가능한 난독화 문자열(Sqid)로 변환하고, 다시 복원하는 책임을 가진 모듈입니다.
- 주요 기능: `encode(id, prefix?)`, `decode(sqid, prefix?)`, `decodeAuto(sqid)`

중요 경고
- 이 모듈은 결정론적 알고리즘과 불변 상수(예: `KNUTH_PRIME`, `KNUTH_INVERSE`, `DJB2_INIT_HASH` 등)에 의존합니다. 해당 상수나 알고리즘을 변경하면 기존에 생성된 모든 Sqid를 복구할 수 없으니 절대 변경하지 마십시오.

구성 파일
- [sqids.constants.ts](src/infrastructure/sqids/sqids.constants.ts) — 접두사 목록, 암호화 상수, 해시/PRNG/셔플 함수 (절대 수정 금지)
- [sqids.service.ts](src/infrastructure/sqids/sqids.service.ts) — 핵심 서비스(인코딩/디코딩 로직)
- [sqids.exception.ts](src/infrastructure/sqids/sqids.exception.ts) — 도메인 예외 정의
- [sqids.module.ts](src/infrastructure/sqids/sqids.module.ts) — 모듈 등록(@Global)
- [controllers/admin/sqids-admin.controller.ts](src/infrastructure/sqids/controllers/admin/sqids-admin.controller.ts) — 관리자용 디코드 엔드포인트
- [controllers/admin/dto](src/infrastructure/sqids/controllers/admin/dto) — Request/Response DTO
- [sqids.service.spec.ts](src/infrastructure/sqids/sqids.service.spec.ts) — 동작 검증 테스트 케이스

환경 설정
- `SqidsService`는 `EnvService`의 `sqids` 설정을 사용합니다. (예: `alphabet`, `minLength`)
- 테스트에서 사용된 예시 값:
  - `alphabet`: `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`
  - `minLength`: `8`

핵심 개념 및 알고리즘

1) 접두사(Prefix)
- 모듈은 `SqidsPrefix` 상수를 통해 도메인별 접두사를 제공(권장: 3글자 규칙). 접두사는 접두사 구분자(`SQIDS_DELIMITER`, 기본 '_')로 본문과 분리됩니다. 예: `fil_abC123`

2) 알파벳 셔플
- 각 접두사별로 동일한 `baseAlphabet`을 `shuffleAlphabet(baseAlphabet, prefix)`로 결정론적으로 섞어 사용합니다.
- 내부적으로는 `hashString(prefix)` → `mulberry32(seed)` → Fisher-Yates 셔플로 고정된 순서로 섞습니다. 따라서 동일한 접두사는 항상 동일한 셔플 결과를 가집니다.

3) Knuth Multiplicative Hash를 이용한 난독화
- 순차적 정수 ID를 그대로 인코딩하면 추측이 쉽기 때문에, 인코딩 전 다음 연산으로 비트 공간을 섞습니다:

  scrambledId = (id * KNUTH_PRIME) & KNUTH_MASK

- 이후 64비트 값을 상위 32비트(`high`)와 하위 32비트(`low`)로 분리해 `sqids` 라이브러리로 인코딩합니다.
- 디코딩 시에는 `scrambledId`를 재구성한 후 KNUTH_INVERSE를 곱하여 원본 ID를 복원합니다:

  originalId = (scrambledId * KNUTH_INVERSE) & KNUTH_MASK

4) Sqids 라이브러리 사용
- 내부적으로 `sqids` 패키지 인스턴스를 prefix별(캐시)로 생성합니다. 인스턴스 생성 옵션: `alphabet`(prefix별 셔플 또는 기본), `minLength`.
- 동일한 ID라도 prefix가 다르면 서로 다른 Sqid(문자열)가 생성됩니다.

API 동작 (요약)
- `encode(id: bigint, prefix?: SqidsPrefixType): string`
  - 입력 검증: `id > 0` (아니면 `InvalidSqidIdException` 발생)
  - Knuth 해시 적용 → 64비트 분할 → `sqids.encode([high, low])`
  - prefix가 주어지면 `
    ${prefix}${SQIDS_DELIMITER}${encoded}` 형태로 반환

- `decode(sqid: string, prefix?: SqidsPrefixType): bigint`
  - prefix가 주어지면 접두사 일치 여부 검사(미일치 시 `InvalidSqidFormatException`)
  - `sqids.decode()`로 숫자 배열([high, low]) 복원
  - 상하위 비트 병합 → KNUTH_INVERSE 적용 → 원본 ID 반환

- `decodeAuto(sqid: string): { id: bigint; prefix: string | null }`
  - `_` 구분자가 있으면 접두사를 잠정 추출하고 `SqidsPrefix` 목록에 있는지 확인
  - 유효한 접두사이면 해당 prefix로 디코딩하고 감지된 prefix 반환
  - 접두사가 없거나 유효하지 않으면 기본 인스턴스로 디코딩

예외 처리
- `InvalidSqidIdException` : `encode`에 0 이하 값 전달 시 발생
- `InvalidSqidFormatException` : 디코딩 실패(형식불일치, prefix 불일치, 디코드 결과 길이 부족 등)

관리자 API
- 엔드포인트: `POST /admin/sqids/decode`
- DTO: `DecodeSqidRequestDto`, `DecodeSqidResponseDto`
- 접근 제한: 관리자 역할 필요(`RequireRoles`)
- 용도: 운영/디버깅을 위해 접두사 포함/미포함 Sqid를 원본 ID로 되돌려 주는 유틸리티

테스트에서 확인된 특이사항
- 같은 ID라도 prefix에 따라 반환되는 Sqid 문자열이 달라집니다(알파벳 셔플 효과).
- `minLength`가 설정되어 있어 짧은 ID도 최소 길이를 보장합니다.

권장 가이드 / 주의사항
- 절대 변경 금지: `sqids.constants.ts`의 핵심 상수 및 알고리즘 함수(`hashString`, `mulberry32`, `shuffleAlphabet`)를 변경하지 마십시오.
- Env 변경 주의: `baseAlphabet` 또는 `minLength` 변경 시 기존 Sqid와 호환되지 않을 수 있으니, 변경 전 마이그레이션 전략을 수립하세요.
- Prefix 추가: `SqidsPrefix`에 새 접두사를 추가할 수는 있으나, 기존 접두사 및 상수는 변경하지 마십시오. 새 접두사는 3글자 규약을 따르세요.
- 사용 위치: 외부 API 응답에 ID를 노출할 때는 항상 `encode`를 사용하고, 수신 파라미터는 `decode(..., prefix)`로 엄격히 검증하세요. `decodeAuto`는 주로 관리자/운영 도구에서 사용합니다.

간단 예시
```ts
// 인코딩
const sqid = this.sqidsService.encode(12345n, SqidsPrefix.USER); // => 'usr_abC12x'

// 디코딩 (명시적 prefix 검증)
const id = this.sqidsService.decode('usr_abC12x', SqidsPrefix.USER); // => 12345n

// 자동 디코드 (관리자 도구)
const { id: decodedId, prefix } = this.sqidsService.decodeAuto('fil_ZyX987');
```

참고 코드
- 서비스: [apps/api/src/infrastructure/sqids/sqids.service.ts](src/infrastructure/sqids/sqids.service.ts)
- 상수/알고리즘: [apps/api/src/infrastructure/sqids/sqids.constants.ts](src/infrastructure/sqids/sqids.constants.ts)
- 예외: [apps/api/src/infrastructure/sqids/sqids.exception.ts](src/infrastructure/sqids/sqids.exception.ts)
- 관리자 컨트롤러: [apps/api/src/infrastructure/sqids/controllers/admin/sqids-admin.controller.ts](src/infrastructure/sqids/controllers/admin/sqids-admin.controller.ts)
- 테스트: [apps/api/src/infrastructure/sqids/sqids.service.spec.ts](src/infrastructure/sqids/sqids.service.spec.ts)

변경 시 체크리스트
1. 변경 필요성 명확화 (보안·버그·성능). 기존 Sqid 복구 문제 검토.
2. 변경 범위 최소화: 상수·알고리즘은 변경하지 않음. 불가피하면 전체 마이그레이션 계획 수립.
3. 운영 영향 분석: 사용자에게 노출된 모든 Sqid(링크, 저장값 등) 영향 확인.
4. 테스트: 모든 prefix에 대해 인코딩/디코딩 일관성 테스트 추가.

---
문서 생성자: GitHub Copilot (자동 생성 문서 — 코드 직접 확인 후 수동 검토 권장)
