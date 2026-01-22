---
name: whitecliff_aggregator_integration
description: Whitecliff 카지노 애그리게이터 통합 및 콜백 구현 지침
---

# 🚀 Whitecliff Aggregator Integration Guide

Whitecliff 카지노 애그리게이터와의 통합 및 콜백 처리를 위한 기술 가이드입니다.

## 📖 Reference Documentation
모든 구현은 반드시 아래 공식 문서를 최우선으로 참조해야 합니다:
- **File Path:** `apps/api/docs/WHITECLIFF_en.html`

## 🛠️ Key Implementation Details

### 1. 인증 및 보안 (Secret Key)
Whitecliff는 HTTP Header를 통한 Secret Key 인증 방식을 사용합니다.
- **Header Key:** `secret-key`
- **Validation:** 해당 키가 설정값(`EnvService.whitecliff`)과 일치하는지 확인하고, 일치하는 설정으로부터 통화(Currency) 정보를 추출합니다.
- **Reference:** `WhitecliffCallbackService.validateSecretKey()`

### 2. 콜백 엔드포인트 구성 (Whitecliff -> Our Server)
Whitecliff는 HTTP Header의 `secret-key`를 통해 인증하며, 다음과 같은 콜백을 요청합니다.
- `POST /balance`: 사용자 잔액 조회
- `POST /debit`: 사용자 잔액 차감 (Betting/Stake)
- `POST /credit`: 사용자 잔액 추가 (Win/Refund/Payout)
- `POST /bonus`: 사용자 보너스 조회
- `POST /bet_results`: 베팅 결과 통보 (상태 변경 및 배당 확정)

### 3. 제공사 API (Our Server -> Whitecliff)
플랫폼에서 Whitecliff 측으로 호출하는 주요 API 목록입니다.
- `POST /auth`: 게임 실행 URL 획득 및 사용자 동기화 (Launch Game)
- `GET /results/{prdId}/{txnId}`: 특정 트랜잭션의 결과 재확인
- `POST /bet/results`: 특정 베팅의 상세 정보 및 결과 조회
- `POST /gamelist`: 제공사/카테고리별 게임 목록 조회
- `POST /getpushbets`: 에볼루션 전용 푸시(Push/Tie) 베팅 내역 조회

### 4. 주요 비즈니스 로직 패턴

#### A. 세션 조회 및 유저 식별
- 요청의 `sid`(세션 ID)를 우선적으로 사용하며, `sid`가 없거나 세션을 찾을 수 없는 경우 `user_id`(whitecliffSystemId)를 사용하여 최근 세션을 조회합니다.
- **Rule:** `sid`로 조회된 세션의 `playerName`이 요청의 `user_id`와 일치하는지 반드시 검증해야 합니다.

#### B. 트랜잭션 처리 (Debit/Credit)
- **Debit (Bet):** `ProcessCasinoBetService`를 호출하여 처리합니다. `txn_id`를 외부 트랜잭션 ID로 사용하며, `round_id`가 없을 경우 `txn_id`를 라운드 ID로 대체합니다.
- **Credit (Win/Refund):** (구현 예정) 당첨금 지급 처리를 담당합니다. `is_cancel` 필드가 `1`인 경우 취소(Refund) 처리를 의미하므로 주의가 필요합니다.

#### C. 에러 응답 규격
- Whitecliff 전용 에러 코드(`INVALID_USER`, `INSUFFICIENT_FUNDS`, `DUPLICATE_TRANSACTION`, `UNKNOWN_ERROR` 등)를 사용하여 응답해야 합니다.
- **Response Format:** `{ status: 0 | 1, balance: number, error?: string }`

## ⚠️ Critical Rules
- **Decimal 처리:** 금액 계산 시 `new Prisma.Decimal(amount)`를 사용하여 정밀도를 유지하십시오.
- **트랜잭션 관리:** 하위 비즈니스 서비스(`ProcessCasinoBetService` 등)에서 이미 트랜잭션을 관리하므로, 콜백 서비스 최상위 메서드에는 `@Transactional()` 중복 사용을 지양합니다.
- **통화 검증:** 요청된 통화가 세션의 통화와 일치하는지 확인하고, 불일치 시 적절한 로깅 또는 에러 처리를 수행하십시오.

## 📂 Related Files
- **Service:** `apps/api/src/modules/casino/providers/whitecliff/application/whitecliff-callback.service.ts`
- **Controller:** `apps/api/src/modules/casino/providers/whitecliff/controllers/whitecliff-callback.controller.ts`
- **Mapper:** `apps/api/src/modules/casino/providers/whitecliff/infrastructure/whitecliff-mapper.service.ts`
- **DTOs:** `apps/api/src/modules/casino/providers/whitecliff/dtos/`
