# API Swagger Rules (Project-wide)

작성일: 2026-04-02

목적: 프로젝트 전역에서 일관된 Swagger 문서화를 위해 준수할 규칙들을 정리합니다.

적용 범위: apps/api 프로젝트의 모든 컨트롤러/DTO/데코레이터

요약 규칙

1. 인증 표기
- 보호된(인증 필요) 컨트롤러/엔드포인트는 클래스 레벨에 `@ApiBearerAuth()`를 적용합니다.
- 퍼블릭 엔드포인트는 `@Public()` 데코레이터를 유지합니다.

2. 응답/오류 스키마
- 성공 응답은 `@ApiResponse` 또는 공통 래퍼(`@ApiStandardResponse` 등)를 사용해 `type`을 명시합니다.
- 대표적인 오류 응답(400/401/403/404/409)은 각 엔드포인트에 최소 하나 이상 명시합니다. (예: `@ApiResponse({ status: 401, description: 'Unauthorized' })`)

3. DTO 문서화
- 모든 요청/응답 DTO 필드에 `@ApiProperty` 또는 `@ApiPropertyOptional`을 적용합니다.
- Enum 필드는 `enum`과 `description`을 함께 표기하여 의미를 설명합니다.
- 복합 객체(Record, Map, nested object)는 가능하면 별도 DTO로 분해하여 `type`으로 지정합니다.

3.1. 다국어(한국어/영어) 표기
- API 문서는 국내 개발자와 외부(영문) 소비자 모두를 고려하여 `description`에 한국어와 영어를 병기합니다.
- 형식 권장: `한국어 설명 / English description` (슬래시로 구분).
- 예시:
	```ts
	@ApiProperty({ description: '활성 여부 / Active flag', example: true })
	isActive: boolean;
	```

4. 페이징/컬렉션
- 페이지네이션 응답은 공통 데코레이터(`@ApiPaginatedResponse`)를 사용해 `data`의 item 타입을 명시합니다.
- 배열 응답에는 `isArray: true` 또는 `type: [ItemDto]`를 명확히 지정합니다.

5. 예시 및 제약
- 중요한 엔드포인트와 복합 DTO에는 `example` 값을 추가합니다.
- 입력 제약(길이, 범위, 배열 크기)은 DTO에 validation 데코레이터(`@Min/@Max/@ArrayMinSize`)로 표기하고, Swagger에도 `minItems/maxItems/minimum/maximum`을 함께 명시합니다.

6. 데코레이터 일관성
- 팀 차원의 표준으로 `ApiStandardResponse`와 `ApiStandardErrors`를 사용하는 경우, 사용 가이드(어떤 경우에 표준 데코레이터를 쓰고 어떤 경우에 `@ApiResponse`를 쓰는지)를 문서 하단에 추가합니다.

권장 적용 작업
- 보호 컨트롤러에 `@ApiBearerAuth()`를 추가하여 인증 필요 여부를 명시.
- 복잡한 policy/setting 객체는 별도 DTO로 분리.
- 실패 응답 표준(공통 ErrorDto)을 정의하고 전 엔드포인트에 적용.

7. 경로 네이밍 컨벤션
- 컨트롤러 수준의 라우트(prefix)는 역할별로 일관되게 사용합니다:
	- `admin/*` : 관리자 전용 엔드포인트(예: `admin/banners`)
	- `public/*` : 인증 없이 공개되는 엔드포인트(예: `public/banners`)
	- 사용자 API는 별도의 접두사 없이 모듈 경로 하위에 둡니다(예: `banners` 대신 `public/banners` 사용 금지 — 공개는 `public/`로 명시).
- 컨트롤러가 전부 공개용이면 클래스 레벨에 `@Public()`을 적용합니다.

참고
- 이 문서는 코드베이스를 읽고 자동 추출한 권장 규칙 초안입니다. 적용 전 팀 리뷰를 권장합니다.
