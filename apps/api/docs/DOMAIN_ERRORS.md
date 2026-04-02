# 도메인 에러 가이드

이 문서는 도메인 레이어에서 예외(도메인 에러)를 일관성 있게 정의하고 사용하는 방법을 설명합니다. 모든 예외는 서비스/컨트롤러/글로벌 필터에서 예측 가능하고 안전하게 처리되어야 합니다.

## 목적
- 도메인 에러 생성 방식의 일관성 확보
- 사용자에게 민감 정보를 노출하지 않도록 보호
- 서비스 계층과 전역 예외 핸들러 간 명확한 계약 제공

## 핵심 규칙 요약
- 상속: 모든 도메인 에러는 `DomainException`을 확장한다 (`src/common/exception/domain.exception.ts`).
- 메시지 코드: 에러 식별자는 `MessageCode` 열거형에 추가하고 사용한다 (`packages/shared/src/constants/message-codes.ts`).
- HTTP 상태: 에러 생성 시 적절한 `HttpStatus`를 명시한다 (예: `NOT_FOUND`, `CONFLICT`, `BAD_REQUEST`).
- 민감 정보 비노출: 에러 메시지나 사용자 응답에 내부 ID·토큰·개인정보를 포함하지 않는다.
- 생성자 파라미터: 사용자에게 보여주지 않는 값(예: 내부 ID)은 에러 메시지에 포함하지 않고, 필요하면 로그/감사에서 따로 기록한다(마스킹 권장).
- 파일 구조: 모듈별로 `*.errors.ts` 파일을 생성하여 관련 예외를 집합한다. 예: `apps/api/src/modules/banner/campaign/domain/banner.errors.ts`.
- 네이밍: `{Resource}{Condition}Exception` 형식 사용 (예: `BannerNotFoundException`).

## 템플릿
다음은 권장 템플릿 예시입니다.

```ts
import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class MyModuleException extends DomainException {
  constructor(message: string, code: MessageCode = MessageCode.VALIDATION_ERROR, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, code, status);
  }
}

export class ResourceNotFoundException extends MyModuleException {
  constructor() {
    super('Requested resource not found.', MessageCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND);
  }
}
```

## MessageCode 추가 절차
1. `packages/shared/src/constants/message-codes.ts`에 새 코드 추가
2. PR 설명에 새 MessageCode 사용 이유와 관련 모듈 링크 기재
3. 코드리뷰 시 에러 매핑(HTTP 상태) 확인

## 로깅 & 감사
- 에러 메시지는 사용자 응답용으로 짧고 일반적이어야 함.
- 내부 상세 정보(예: ID, DB 에러)는 로그/감사에 별도 필드로 남기되 마스킹/제한된 접근 적용.
- Audit 로그에 민감값 저장 금지. 필요 시 해시 또는 참조 ID만 기록.

## 글로벌 처리(권장)
- 전역 예외 필터(또는 인터셉터)에서 `DomainException`을 잡아 `errorCode`와 `httpStatus`를 이용해 응답을 구성한다.
- 예시 응답 형식: `{ code: MessageCode, message: string }` (디버그 환경에서만 추가 메타 포함).

## 테스트
- 각 예외 클래스는 생성자 동작과 `errorCode`/`httpStatus`가 올바른지 단위 테스트를 작성한다.

## 체크리스트 (PR 제출 전)
- [ ] 새 MessageCode가 `packages/shared`에 추가되었는가?
- [ ] 예외 메시지에 민감 정보가 포함되어 있지 않은가?
- [ ] 적절한 HTTP 상태가 지정되었는가?
- [ ] 관련 단위 테스트가 추가되었는가?

---

이 가이드를 업데이트하거나 템플릿을 확장하고 싶으면 PR로 제안해주세요.
