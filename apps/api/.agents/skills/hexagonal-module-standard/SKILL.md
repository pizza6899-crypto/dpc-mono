---
name: hexagonal-module-standard
description: NestJS 모듈 구현 가이드 (경량 헥사고날 아키텍처, 컨트롤러 표준 및 유지보수 중심 설계)
---

# 🏗️ Hexagonal Module Implementation Guide

## Overview
이 스킬은 프로젝트의 코드 일관성과 유지보수성을 극대화하기 위한 **경량 헥사고날 아키텍처(Lightweight Hexagonal Architecture)** 표준을 정의합니다. 
Wallet 모듈(`apps/api/src/modules/wallet`)을 표준 모델로 삼으며, 계층 간 의존성 방향(DIP)과 도메인 중심 설계를 지향합니다.

## 핵심 원칙
1.  **관심사 분리 (Separation of Concerns)**: 비즈니스 로직(Domain), 유즈케이스(Application), 외부 연동(Infrastructure/Presentation)을 엄격히 분리합니다.
2.  **경량화 (Lightweight)**: 과도한 추상화보다는 현실적인 유지보수 효율을 중시합니다.
3.  **DIP (Dependency Inversion)**: 고수준 레이어가 저수준 레이어의 구현체에 직접 의존하지 않도록 `Port`를 사용합니다.
4.  **엔티티 중심 (Rich Domain Model)**: 상태와 행위를 엔티티에 응집시킵니다.

---

## 📂 디렉토리 구조 및 레이어 역할

| 디렉토리 | 역할 | 핵심 가이드 |
| :--- | :--- | :--- |
| `controllers/` | **Presentation Layer** | 외부 인터페이스(HTTP). [Controller Standard](skill:controller-standard) 참조. |
| `application/` | **Application Layer** | 유즈케이스 조정. `XXXService`로 명명하되 내부엔 `execute()` 메서드 권장. |
| `domain/` | **Domain Layer** | 순수 비즈니스 로직(Entity, Policy, Exception). 의존성 제로. |
| `ports/` | **Interface Layer** | Repository Port 등 외부 연동용 인터페이스 정의. <br> (가급적 `ports/` 하위에 직접 정의하거나 도메인별 `ports/repositories/` 등으로 분류하며, 불필요한 레이블성 폴더(`out/`, `in/` 등)는 지양) |
| `infrastructure/` | **Infrastructure Layer** | DB(Repository, Mapper) 등 기술적 구현. 엔티티 변환은 전용 `Mapper` 권장. |

---

## 📚 아키텍처 문서화 (Architecture Documentation)

복잡한 비즈니스 로직을 가진 모듈(예: Tier, Wallet)은 반드시 모듈 최상위에 `README.md`를 포함하여 아키텍처 의도를 문서화해야 합니다.

---

## 🛠️ 레이어별 세부 가이드

### 1. Domain Layer (`domain/`)
*   **Entity**: 생성자는 `private`, 상태 변경은 `activate()` 등 비즈니스 메서드 사용. 필드 캡슐화 보호.
*   **Policy**: 여러 엔티티가 참여하는 복잡한 중재 로직 전담.

### 2. Application Layer (`application/`)
*   **Service (UseCase)**: 명칭은 `XXXService`를 사용하되, 하나의 클래스가 하나의 비즈니스 행위(유즈케이스)를 담당하고 `execute()` 메서드를 진입점으로 가집니다.
*   **Consistency**: `AdvisoryLockService`를 통한 경쟁 상태 방지 필수.
*   **DTO 결합도 제거 (DTO Decoupling)**: 
    *   서비스 레이어는 프레젠테이션 레이어의 **DTO를 직접 참조하지 않습니다**.
    *   입력 데이터는 서비스 파일 상단에 정의된 **`interface XXXParams`** (또는 `Command`)를 사용합니다.
    *   출력 데이터는 도메인 **`Entity`** 또는 **`Result`** 인터페이스를 반환합니다.

### 3. Infrastructure Layer (`infrastructure/`)
*   **Mapper**: DB 모델(Prisma/Kysely)과 도메인 엔티티 간 양방향 변환을 독립된 `XXX.mapper.ts` 파일로 관리하는 것을 권장합니다.
*   **Repository**: `@InjectTransaction()`을 주입받아 사용하며, `ports/` 하위에 정의된 인터페이스를 구현합니다.

---

## ✅ 구현 체크리스트
1. [ ] 서비스(Application)가 구현체가 아닌 `ports/` 인터페이스에 의존하는가?
2. [ ] 서비스 명칭이 `XXXService`이며, `execute()` 메서드를 핵심 진입점으로 사용하는가?
3. [ ] 입력 데이터 전달을 위해 DTO가 아닌 내부 인터페이스(`Params` 등)를 사용하는가?
4. [ ] 모든 상태 변경 로직이 트랜잭션 내에서 원자적으로 처리되는가?
5. [ ] 엔티티 변환을 위해 독립된 `Mapper` 클래스나 파일을 사용하고 있는가?
6. [ ] **컨트롤러 구현이 [Controller Standard](skill:controller-standard)를 준수하는가?**


