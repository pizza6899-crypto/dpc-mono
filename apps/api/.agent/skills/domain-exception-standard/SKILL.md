---
name: domain-exception-standard
description: 도메인 주도 설계(DDD) 기반의 예외 처리 및 도메인 익셉션 작성 가이드 (i18n 및 보안 강화)
---

# 도메인 예외 (Domain Exception) 구현 표준

이 문서는 프로젝트 내에서 비즈니스 로직 위반이나 도메인 규칙 오류를 처리하기 위한 예외 클래스 작성 표준을 정의합니다. 특히 **다국어 서비스(i18n)** 환경에서 프론트엔드가 에러 코드를 기반으로 메시지를 렌더링할 수 있도록 설계되었습니다.

---

## ✅ 핵심 원칙

1. **에러 코드 중심 (i18n)**: 클라이언트(프론트엔드)는 백엔드의 `message`가 아닌 `errorCode`를 식별자로 사용하여 다국어 메시지를 렌더링합니다.
    - **명시적 코드 사용**: `VALIDATION_ERROR`와 같은 지나치게 일반적인 코드 사용을 지양합니다. 모듈별로 구체적인 에러 코드를 사용하여 프론트엔드에서 각 상황에 맞는 정확한 메시지를 보여줄 수 있어야 합니다.
    - **공용 모듈 정의**: 사용하려는 에러 코드가 없다면, 반드시 **`@repo/shared`의 `MessageCode`에 새 코드를 정의**한 후 사용해야 합니다.
2. **내부 식별자 노출 금지 (Security)**: `message` 필드에 DB의 내부 ID(Raw BigInt 등)를 노출하지 않습니다. 
    - 우리 시스템은 Sqids를 통해 ID를 인코딩하여 노출하므로, 에러 메시지에 "User 233 not found"와 같이 내부 ID가 찍히면 사용자에게 혼란을 주고 보안상 취약점이 될 수 있습니다. 셔플된 외부용 ID를 사용하거나, 특정 식별자 없이 일반적인 문구를 사용하십시오.
3. **간결한 메시지**: 백엔드 `message`는 개발자 참고용 또는 폴백(Fallback)용으로만 사용하며, 최대한 간결하고 일반적인 문구로 작성합니다.
4. **계층화된 구조**: `DomainException`을 상속받아 모듈별 베이스 예외를 구성합니다.

---

## 🛠 구현 가이드

### 1. 예외 클래스 작성 규칙

- **파일 위치**: 모듈의 domain 레이어 (예: `src/modules/tier/master/domain/tier-master.exception.ts`)
- **ErrorCode**: 반드시 `@repo/shared`의 `MessageCode`를 사용합니다.
- **Message**: 내부 식별자를 포함하지 않는 일반적인 문구로 작성합니다.

### 2. 작성 예시

```typescript
import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared'; // 공용 에러 코드 사용
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * 1. 모듈 베이스 예외
 */
export class TierMasterException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
    this.name = 'TierMasterException';
  }
}

/**
 * 2. 구체적인 도메인 예외
 */
export class TierSettingsNotFoundException extends TierMasterException {
  constructor() {
    super(
      'Tier settings not found',             // 내부 ID 노출 금지 (User 233... 대신 일반 메시지)
      MessageCode.TIER_NOT_FOUND,            // 프론트엔드 다국어 처리를 위한 식별자
      HttpStatus.NOT_FOUND,
    );
    this.name = 'TierSettingsNotFoundException';
  }
}
```

---

## 📝 필수 체크리스트

1. **`MessageCode` 사용**: 에러 코드가 `@repo/shared`에 정의되어 있는가? (없다면 추가 정의 필요)
2. **내부 ID 필터링**: 메시지에 `id`, `userId` 등 내부 숫자가 포함되지 않았는가?
3. **프론트엔드 정합성**: 이 에러 코드를 통해 프론트엔드에서 적절한 다국어 텍스트를 보여줄 수 있는가?
4. **디버깅 정보**: 상세한 디버깅 정보(예: 어떤 ID에서 에러가 났는지)가 필요하다면, 메시지가 아닌 서버 로그(`Logger`)에 남기고 있는가?

---

## 🚀 프론트엔드 연동 (참고)

프론트엔드는 응답 버디의 `errorCode`를 보고 다음과 같이 처리합니다.

```javascript
// 프론트엔드 예시
const errorMessage = i18n.t(`ERROR_CODES.${response.errorCode}`); 
// response.errorCode가 'TIER_NOT_FOUND'라면 해당하는 다국어 텍스트 출력
```
