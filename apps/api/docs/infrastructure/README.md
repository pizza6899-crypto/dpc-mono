# Infrastructure Docs

위치는 `apps/api/docs/infrastructure/` 입니다.

문서 목록
- [BULLMQ.md](BULLMQ.md) — BullMQ 인프라 모듈 구조, 런타임 흐름, 작성 패턴
- [CACHE.md](CACHE.md) — Cache 인프라 모듈 구조, 저장소 전략, 사용 패턴
- [CLS.md](CLS.md) — CLS 요청 컨텍스트 모듈 구조, 트랜잭션 연동, 컨텍스트 접근 패턴
- [CONCURRENCY.md](CONCURRENCY.md) — 동시성 제어 인프라 구조, Advisory Lock/Global Lock 전략, 사용 패턴
- [ENV.md](ENV.md) — 환경 설정 인프라 구조, Config 로딩/타입 facade, 사용 패턴과 주의점
- [PERSISTENCE.md](PERSISTENCE.md) — 영속성 경계 타입 변환 유틸 구조, Cast/PersistenceOf 규칙, 사용 패턴
- [SNOWFLAKE.md](SNOWFLAKE.md) — Snowflake ID 생성 모듈 구조, 내부/외부 시각 생성 로직, parse 활용 패턴
- [SQIDS.md](SQIDS.md) — Sqids 모듈 참고 문서
- [THROTTLE.md](THROTTLE.md) — 요청 제한 인프라 구조, Guard/Service 이중 사용 패턴, Redis 카운터 동작
- [WEBSOCKET.md](WEBSOCKET.md) — WebSocket 인프라 구조, 네임스페이스/룸 설계, 세션/훅/실시간 이벤트 흐름

운영 원칙
- 인프라 공통 모듈 문서는 이 폴더 아래에 모듈 단위로 추가합니다.
- 문서에는 구현 파일 구조, 런타임 흐름, 실제 사용 패턴, 작업 체크리스트를 함께 기록합니다.