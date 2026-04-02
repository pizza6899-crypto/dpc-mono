---
name: dcs_aggregator_integration
description: DCS (DC Aggregator) Seamless Wallet 통합 및 콜백 구현 지침
---

# 🚀 DCS Aggregator Integration Guide

DCS(DC Aggregator)와의 Seamless Wallet 통합 및 콜백 처리를 위한 전문 기술 가이드입니다.

## 📖 Reference Documentation
모든 구현은 반드시 아래 공식 문서를 최우선으로 참조해야 합니다:
- **File Path:** `references/DCS Seamless wallet API document V1.40.md`

## 🛠️ Key Implementation Details

### 1. 인증 및 보안 (MD5 Sign)
DCS의 모든 요청은 MD5 해시를 이용한 서명 검증이 필요합니다.
- **Base String:** `brand_id` + `additional_params` (순서 주의) + `api_key`
- **Verification:** 요청의 `sign` 필드와 서버에서 계산한 MD5 값이 일치하는지 확인합니다.
- **Reference:** `DcsCallbackService.verifySign()`

### 2. 콜백 엔드포인트 구성 (DCS -> Our Server)
DCS는 단일 콜백 URL을 사용하거나 기능별 멀티 엔드포인트를 지원합니다.
- `POST /dcs/login`: 세션 개시 및 잔액 확인 (가장 먼저 호출됨)
- `POST /dcs/getBalance`: 단순 잔액 조회
- `POST /dcs/wager`: 베팅 처리 (Debit)
- `POST /dcs/endWager`: 베팅 결과 처리 및 당첨금 지급 (Credit/Win)
- `POST /dcs/cancelWager`: 베팅 취소 및 환불 (Refund)
- `POST /dcs/appendWager`: 추가 베팅 (기존 라운드에 금액 추가)
- `POST /dcs/freeSpinResult`: 무료 스핀 결과 통보
- `POST /dcs/promoPayout`: 프로모션에 의한 잔액 추가

### 3. 제공사 API (Our Server -> DCS)
플랫폼에서 DCS 측으로 호출하는 주요 API 목록입니다.
- `POST /dcs/loginGame`: 실제 게임 실행 URL 획득
- `POST /dcs/tryGame`: 데모 게임 실행 URL 획득
- `POST /dcs/getGameList`: 프로바이더별 게임 리스트 획득
- `POST /dcs/getBetData`: 상세 베팅 기록 데이터 동기화
- `POST /dcs/getUsersBetSummary`: 일자별 베팅 요약 통계 조회
- `POST /dcs/getReplay`: 특정 라운드의 리플레이 데이터 조회
- `POST /dcs/createFreeSpin`: 무료 스핀 캠페인 생성
- `POST /dcs/addFreeSpin`: 특정 유저에게 무료 스핀 부여
- `POST /dcs/queryFreeSpin`: 무료 스핀 상태 및 이력 조회

### 4. 주요 비즈니스 로직 패턴

#### A. 세션 및 유저 식별
- DCS로부터 전달받은 `token` 또는 `brand_uid`(우리 쪽 User ID)를 사용하여 `findCasinoGameSessionService`를 통해 유효한 세션을 찾습니다.

#### B. 멱등성(Idempotency) 처리
- 동일한 `wager_id` 혹은 `tid`를 가진 중복 요청이 올 수 있으므로, 반드시 DB의 `GameTransaction` 테이블을 조회하여 중복 처리를 방지해야 합니다.
- **Rule:** 이미 성공한 트랜잭션은 에러가 아닌 성공 응답과 유효한 잔액을 반환해야 합니다.

#### C. 에러 응답 규격
- DCS 전용 응답 코드(`DcsResponseCode`)와 메시지 규격을 준수해야 합니다.
- 시스템 에러 시 `status: 0`, 메시지는 문서에 명시된 에러 상수를 사용합니다.

## ⚠️ Critical Rules
- **Decimal 처리:** 금액 계산 시 부동 소수점 오차 방지를 위해 반드시 `Prisma.Decimal` (Decimal.js 기반)을 사용하십시오.
- **로깅:** 모든 요청과 응답, 특히 검증 실패 사유를 상세히 로깅 하십시오 (`DcsCallbackService.logger`).
- **타임아웃:** 카지노 네트워크 지연에 대비하여 트랜잭션 처리를 최적화하십시오.

## 📂 Related Files
- **Application Service:** `apps/api/src/modules/casino/providers/dcs/application/dcs-game.service.ts`
- **Callback Service:** `apps/api/src/modules/casino/providers/dcs/application/dcs-callback.service.ts`
- **Controller:** `apps/api/src/modules/casino/providers/dcs/controllers/dcs-callback.controller.ts`
- **API Service:** `apps/api/src/modules/casino/providers/dcs/infrastructure/dcs-api.service.ts`
- **Mapper:** `apps/api/src/modules/casino/providers/dcs/infrastructure/dcs-mapper.service.ts`
- **DTOs:** `apps/api/src/modules/casino/providers/dcs/dtos/`
