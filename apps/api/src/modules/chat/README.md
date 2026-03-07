# Chat Module

이 모듈은 서비스 내의 모든 채팅 통신과 고객 접점(CS) 비즈니스 로직을 관리합니다.
`tier` 모듈의 구조를 벤치마킹하여, 공통 통신 계층(`rooms`)과 비즈니스 프로세스(`support`)로 서브 모듈을 분리하여 설계되었습니다.

## 1. 개요 (Overview)

- **`rooms`**: "메시지 송수신"이라는 핵심 인프라와 단체/개인 채팅방의 멤버십을 관리합니다.
- **`support`**: 고객의 문의(Ticket) 발생부터 상담원 배정, 종결에 이르는 CS(Customer Support) 워크플로우를 관리합니다.
- **`config`**: 채팅 시스템의 글로벌 정책(메시지 길이, 도배 방지, 최소 레벨 등)을 관리합니다.

## 2. 아키텍처 및 구조 (Architecture)

### 서브 모듈 정의
1.  **Rooms Submodule (`/rooms`)**
    - **핵심 엔티티**: `ChatRoom`, `ChatMessage`, `ChatRoomMember`
    - **역할**: 전역 채팅, 카테고리 채팅, 실시간 소켓 브로드캐스팅, 메시지 이력 조회
2.  **Support Submodule (`/support`)**
    - **핵심 엔티티**: `SupportTicket`
    - **역할**: 문의 티켓 생성, 상담 상태(OPEN, IN_PROGRESS 등) 관리, 담당 상담원 배정 및 성과 통계
3.  **Config Submodule (`/config`)**
    - **핵심 엔티티**: `ChatConfig`
    - **역할**: 글로벌 채팅 활성화 여부, 메시지 속도 제한(Slow mode), 금칙어 관리 등 정책(Policy) 제어

## 3. 핵심 정책 (Core Policies)

### A. ID 전략
- `ChatMessage`는 분산 환경과 대용량 처리를 위해 **Snowflake ID**를 사용합니다.
- 외부 노출(User API) 시에는 `Sqids`를 통해 난독화 처리합니다.

### B. 통신 방식
- **송신**: REST API (`POST /chat/messages`)를 통해 서버에 저장하고 유효성을 검사합니다.
- **수신/브로드캐스팅**: `Socket.io Gateway`를 통해 실시간으로 전달합니다.

---

## 4. 구현 가이드

- 새로운 채팅방 타입이 추가되거나 통신 방식이 변경될 경우 `rooms` 영역을 수정합니다.
- 고객 응대 프로세스(배정 로직, 타임아웃, 자동 종료 등)를 개선할 경우 `support` 영역을 수정합니다.
- 두 모듈은 서로의 구현체에 직접 의존하지 않으며, 필요 시 서비스(UseCase) 레이어를 통해 협력합니다.
