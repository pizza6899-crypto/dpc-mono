# API Swagger Rules (Project-wide)

작성일: 2026-04-02

목적: 프로젝트 전역에서 일관된 Swagger 문서화를 위해 준수할 규칙들을 정리합니다.

적용 범위: apps/api 프로젝트의 모든 컨트롤러/DTO/데코레이터

요약 규칙

1. 인증 표기
- 본 프로젝트의 인증 방식은 **쿠키/세션 기반**입니다.
- 인증 표기는 기본적으로 `RequireRoles(...)` 또는 `Perms(...)` 데코레이터를 통해 Swagger에 자동으로 반영됩니다. 따라서 데코레이터를 사용하는 경우에는 개별 컨트롤러에 `@ApiCookieAuth()`를 명시할 필요가 없습니다.
- 퍼블릭 엔드포인트는 `@Public()` 데코레이터를 유지합니다.
- 예외: 만약 보호 컨트롤러에서 권한 데코레이터를 사용하지 않는 특수한 경우(드물음)가 있다면, 해당 컨트롤러 클래스에 `@ApiCookieAuth()`를 명시해 Swagger에 인증 방식을 표시할 수 있습니다.

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

- 권장 적용 작업
- 인증 표기는 `RequireRoles`/`Perms`를 통해 자동화하세요. (권한 기반 보호가 필요한 컨트롤러에서는 해당 데코레이터를 사용)
- 예외적으로 데코레이터를 사용하지 않는 보호 컨트롤러에 한해 클래스 레벨에 `@ApiCookieAuth()`를 추가할 수 있습니다.
- 복잡한 policy/setting 객체는 별도 DTO로 분리.
- 실패 응답 표준(공통 ErrorDto)을 정의하고 전 엔드포인트에 적용.

7. 경로 네이밍 컨벤션
- 컨트롤러 수준의 라우트(prefix)는 역할별로 일관되게 사용합니다:
	- `admin/*` : 관리자 전용 엔드포인트(예: `admin/banners`)
	- `public/*` : 인증 없이 공개되는 엔드포인트(예: `public/banners`)
	- 사용자 API는 별도의 접두사 없이 모듈 경로 하위에 둡니다(예: `banners` 대신 `public/banners` 사용 금지 — 공개는 `public/`로 명시).
- 컨트롤러가 전부 공개용이면 클래스 레벨에 `@Public()`을 적용합니다.

8. Audit 로깅(AuditLog) 사용 규칙
- 중요한 상태 변경(생성/수정/삭제)이나 보안·규정상 감사가 필요한 엔드포인트에는 `@AuditLog()`(또는 프로젝트의 감사 데코레이터)를 적용합니다.
- 적용 위치: 메서드 레벨에서 구체적인 `action`과 `extractMetadata`를 설정하는 것을 권장합니다. 일부 경우(모듈 전체에 일괄 적용 필요) 클래스 레벨 적용을 고려하세요.
- 예시:
	```ts
	@Post()
	@AuditLog({
		type: LogType.ACTIVITY,
		category: 'BANNER',
		action: 'BANNER_CREATE_ADMIN',
		extractMetadata: (req, args, result) => ({ id: result?.id }),
	})
	async create(@Body() dto: CreateBannerAdminRequestDto) { ... }
	```
- 참고: 퍼블릭(read-only) 엔드포인트는 일반적으로 감사 로그를 남기지 않지만, 사용성·모니터링 관점에서 필요하면 적용할 수 있습니다. 관리자 및 사용자 행위 중 중요한 작업에는 반드시 Audit 데코레이터를 고려하세요.

참고
- 이 문서는 코드베이스를 읽고 자동 추출한 권장 규칙 초안입니다. 적용 전 팀 리뷰를 권장합니다.
