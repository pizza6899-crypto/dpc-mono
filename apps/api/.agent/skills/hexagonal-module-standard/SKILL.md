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
| `controllers/` | **Presentation Layer** | 외부 인터페이스(HTTP). 자세한 구현은 [Controller Standard](skill:controller-standard) 참조. |
| `application/` | **Application Layer** | 유즈케이스 조정, 트랜잭션(`@Transactional`), 동시성 제어(`Lock`). |
| `domain/` | **Domain Layer** | 순수 비즈니스 로직(Entity, Policy, Exception). 의존성 제로. |
| `ports/` | **Interface Layer** | 의존성 역전을 위한 `Port`(Interface) 및 `Token`(Injection ID). |
| `infrastructure/` | **Infrastructure Layer** | DB(Repository, Mapper), 외부 API 클라이언트 등 기술적 구현. |

---

## 🛠️ 레이어별 세부 가이드

### 1. Domain Layer (`domain/`)
*   **Entity**: 생성자는 `private`, 상태 변경은 `activate()` 등 비즈니스 메서드 사용. 필드 캡슐화 보호.
*   **Policy**: 여러 엔티티가 참여하는 복잡한 중재 로직 전담.

### 2. Application Layer (`application/`)
*   **UseCase**: 하나의 행위를 수행하는 서비스 클래스 지향.
*   **Consistency**: `AdvisoryLockService`를 통한 경쟁 상태 방지 필수.

### 3. Infrastructure Layer (`infrastructure/`)
*   **Mapper**: DB 모델(Prisma)과 도메인 엔티티 간 양방향 변환.
*   **Repository**: `@InjectTransaction()`을 주입받아 사용하며, 항상 도메인 엔티티를 반환.
     ```typescript
     @Injectable()
     export class MyRepository implements MyRepositoryPort {
         constructor(
             @InjectTransaction()
             private readonly tx: PrismaTransaction,
         ) {}

         async find(id: string) {
             // this.tx를 통해 현재 트랜잭션 컨텍스트나 기본 클라이언트 접근
             const record = await this.tx.myModel.findUnique({ where: { id } });
             return record ? MyEntity.fromPersistence(record) : null;
         }
     }
     ```

---

## � 구현 체크리스트
1. [ ] 모듈 파일 상단에 책임(Responsibility)과 제외(Exclusion) 범위가 명시되었는가?
2. [ ] 서비스(Application)가 구현체가 아닌 `Port` 인터페이스에 의존하는가?
3. [ ] 모든 상태 변경 로직이 트랜잭션 내에서 원자적으로 처리되는가?
4. [ ] 엔티티가 단순 데이터 꾸러미가 아닌 비즈니스 행위를 포함하고 있는가?
5. [ ] **컨트롤러 구현이 [Controller Standard](skill:controller-standard)를 준수하는가?**
