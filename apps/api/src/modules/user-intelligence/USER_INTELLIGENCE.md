# User Intelligence Module (사용자 지능형 평가 시스템)

## 1. 개요 (Overview)
User Intelligence 모듈은 서비스 내 사용자의 활동 데이터를 수집하고 분석하여, 사용자별 **가치(Value)**와 **리스크(Risk)**를 정량적으로 수치화하는 도구입니다. 이 점수는 운영 정책 수립, VIP 관리, 어뷰징 탐지 등의 기초 자료로 활용됩니다.

## 2. 모듈 구조 (Architecture)
본 모듈은 클린 아키텍처 및 도메인 기반 설계를 바탕으로 다음과 같이 구성되어 있습니다:

- **`metric`**: 카지노, 월렛, 세션 등 타 도메인에서 원천 데이터를 수집하고 집계하는 역할을 수행합니다.
- **`scoring`**: 수집된 메트릭을 바탕으로 실제 점수(Value/Risk)를 산출하는 계산 엔진을 포함합니다.
- **`policy`**: 점수 산출 시 적용되는 가중치나 기준값(Threshold) 등의 정책을 관리합니다.
- **`history`**: 시간 흐름에 따른 사용자의 점수 변화 이력을 기록하고 추적합니다.
- **`common/math`**: 변동계수(CV), 선형 보간(Linear Interpolation) 등 통계적 계산 유틸리티를 제공합니다.

## 3. 스코어링 체계 (Scoring System)

### 3.1 가치 평가 (Valuation Score)
- **기본 점수**: 1000점 (최소 1000 / 최대 2000)
- **평가 항목 (250 / 200 / 100 / 250 / 200 배분)**:
  1.  **가치 지수(Value Index)**: 총 Net Loss, 최근 30일 Net Loss, 수익 안정성(CV) 기반 가치 산출.
  2.  **입금액(Deposit Amount)**: 기간별 입금 총액 및 입금 안정성(CV)에 따른 가중치 부여.
  3.  **입금 횟수(Deposit Count)**: 입금 빈도 및 입금 간격의 일정성 평가.
  4.  **롤링(Rolling)**: 입금액 및 요구 롤링 대비 실제 베팅 기여도, 보너스 의존도(감점) 평가.
  5.  **행동 패턴(Behavior)**: 접속 일수, 세션 시간, 커뮤니티 활동성, 미션 수행률 기반 충성도 평가.

### 3.2 리스크 평가 (Risk Score)
- **최종 점수 = 가치 평가 점수 - 리스크 점수**
- **평가 항목**:
  1.  **프로모션 리스크**: 보너스 대비 입금 비율, 최소 롤링 충족률 기반 체리피킹 위험 탐지.
  2.  **기술/계정 리스크**: IP/지문 중복, 기기 일관성 부족, 잦은 Fingerprint 변화 탐지.
  3.  **행동/커뮤니티 리스크**: 저가치 추천인 연결성, 악성 커뮤니티 활동 이력 탐지.

## 4. 데이터 흐름 (Data Flow)
1.  **Metrics Gathering**: `I...MetricPort`를 통해 각 도메인의 활동 데이터를 수집.
2.  **Calculations**: `UserIntelligenceMath`를 활용해 CV(변동계수) 등 통계값 산출.
3.  **Scoring**: `UserIntelligenceCalculatorService`를 통해 정책 가중치를 적용하여 최종 점수 생성.
4.  **Persistence**: `UserIntelligenceScore` 및 `Metric` 테이블에 결과 저장 및 `History` 기록.

---
*본 문서는 시스템 설계 및 정책 변화에 따라 지속적으로 업데이트됩니다.*
