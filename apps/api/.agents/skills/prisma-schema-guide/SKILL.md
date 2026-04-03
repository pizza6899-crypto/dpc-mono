---
name: prisma_schema_guide
description: Prisma 스키마 생성 및 수정 시 참고할 가이드 및 모범 사례 (ID 전략 및 파티셔닝 포함)
---

# Prisma Schema Design & Modification Guide

## Overview
Prisma 스키마(`apps/api/prisma/schema/*.prisma`)를 새로 생성하거나 수정할 때 참고해야 할 설계 원칙, 명명 규칙, ID 전략, 동시성 제어 방식 등을 정의합니다.

## 핵심 원칙 (Core Principles)

### 1. ID 전략: All BigInt
*   모든 테이블의 Primary Key(ID)는 **`BigInt`** 타입을 사용합니다.
*   UUID 대신 `BigInt`를 사용하여 인덱스 크기를 줄이고 성능을 최적화합니다.
*   자동 증가(`autoincrement()`) 혹은 Snowflake ID 생성 로직을 따릅니다.
*   **신규 생성 관례**: 애플리케이션(도메인 엔티티)에서 아직 DB ID가 할당되지 않은 신규 객체는 ID 값을 **`0n`**으로 설정합니다. Repository의 `save` 메서드는 이 `0n`을 보고 `create`와 `update`를 분기합니다. (ID를 `null`로 두는 것보다 타입 안정성 측면에서 우수함)
*   **Repository**: `@InjectTransaction()`을 주입받아 사용하며, `ports/` 하위에 정의된 인터페이스를 구현합니다.
    *   **신규 생성 처리**: `save(entity)` 메서드 구현 시, `entity.id === 0n` 조건을 확인하여 신규 생성(`create`)과 기존 수정(`update/upsert`)을 명확히 분기합니다. 이 방식을 통해 도메인 모델에서 `id: bigint` 타입을 non-nullable로 유지할 수 있습니다. (ID를 `null`로 두는 것보다 타입 안정성 측면에서 우수함)

### 2. 동시성 제어: No Optimistic Lock Fields
*   **낙관적 락(Optimistic Locking)을 위한 필드(예: `version`, `lock_version`)를 추가하지 않습니다.**
*   모든 동시성 제어는 애플리케이션 레벨의 **Advisory Lock(권고 락)** 또는 **`SELECT ... FOR UPDATE`** (Pessimistic Locking)을 통해 처리합니다.
*   스키마는 데이터 구조 정의에 집중하고, 락킹 로직은 비즈니스 로직(Service 계층)으로 위임합니다.

### 3. 파티셔닝 고려 설계 (Partitioning Strategy)
*   로그성 데이터, 거래 내역 등 대용량 누적이 예상되는 테이블은 초기 설계부터 **PostgreSQL 파티셔닝(`pg_partman`)**을 고려해야 합니다.
*   **복합 키(Composite Key) 사용**: 파티셔닝 키(주로 시간 컬럼)가 Primary Key에 포함되어야 하는 PostgreSQL 제약 조건을 고려하여 설계합니다.
*   **Snowflake ID 활용**: 고유 식별자로 Snowflake ID(BigInt)를 사용하며, 필요한 경우 `created_at`과 결합하여 파티셔닝 효율을 높입니다.

## 상세 가이드 (Instructions)

### Naming & Mapping
*   **Model**: `PascalCase` (예: `UserWallet`)
*   **Field**: `camelCase` (예: `userId`)
*   **DB Map**: `@map`, `@@map`을 필수로 사용하여 DB상에서는 `snake_case`를 유지합니다.

### 데이터 타입 가이드
| 구분 | Prisma Type | DB Type Mapping | 비고 |
| :--- | :--- | :--- | :--- |
| **ID** | `BigInt` | `BigInt` | 기본 전략 |
| **금액** | `Decimal` | `@db.Decimal(32, 18)` | 암호화폐 표준 정밀도 |
| **JSON** | `Json` | `jsonb` | 메타데이터 저장용 |
| **Enum** | `Enum` | `Enum` | Postgres Native Enum 권장 |
| **IP** | `String` | `@db.Inet` | IPv4/IPv6 지원 |

### 수치 및 통화 데이터 정밀도 (Numeric & Monetary Precision)

금액, 비율, 점수 등 수치 데이터를 다룰 때는 용도에 맞는 정확한 타입을 사용해야 합니다.

*   **금액 (Monetary Values)**
    *   **Anti-Pattern**: `Float`나 `Double`은 부동 소수점 연산 오차가 발생하므로 금전 데이터에 절대 금지합니다.
    *   **Type Strategy**: `Decimal`
    *   **Mapping**: **`@db.Decimal(32, 18)`**
        *   **32**: 전체 자릿수 (암호화폐 등 매우 큰 단위와 소수점 이하 정밀도를 모두 커버)
        *   **18**: 소수점 이하 자릿수 (ETH/WEI 단위 등 블록체인 표준 및 고정밀 금융 연산 지원)
    *   **Example**: `balance Decimal @default(0) @db.Decimal(32, 18)`

*   **비율 (Rates & Fee Percentages)**
    *   수수료율, 기여율, 엣지 등은 소수점 4자리까지 관리합니다.
    *   **Mapping**: **`@db.Decimal(8, 4)`**
    *   **Example**: `feeRate Decimal @db.Decimal(8, 4)` (예: `0.0015` = 0.15%)

*   **RTP (Return to Player)**
    *   UI 표시용 백분율(%) 데이터도 비율과 동일하게 처리합니다.
    *   **Mapping**: **`@db.Decimal(8, 4)`**
    *   **Example**: `rtp Decimal @db.Decimal(8, 4)` (예: `96.5000`)

*   **정수형 (Counts & Integers)**
    *   **`Int` (4bytes)**: 일반적인 카운트, 순서, 작은 범위의 수치.
    *   **`BigInt` (8bytes)**: ID, 매우 큰 수량, 오버플로우 가능성이 있는 누적 데이터.

*   **IP 주소 (IP Address)**
    *   PostgreSQL의 `inet` 타입을 사용하여 IPv4/IPv6 유효성 검증 및 CIDR 연산을 지원합니다.
    *   **Prisma Type**: `String`
    *   **Mapping**: **`@db.Inet`**
    *   **Example**: `ipAddress String @map("ip_address") @db.Inet`

## Examples

### 1. 표준 테이블 (Standard Table)
일반적인 엔티티 테이블 설계 예시입니다. ID는 BigInt를 사용하고 1개의 PK를 가집니다.

```prisma
model UserWallet {
  // ID는 항상 BigInt
  id        BigInt   @id @default(autoincrement()) 
  
  // 외래 키 매핑
  userId    BigInt   @map("user_id")
  
  // 금액은 Decimal 사용
  balance   Decimal  @default(0) @db.Decimal(20, 8)
  
  // 낙관적 락 필드(version) 없음
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("user_wallets")
}
```

### 2. 파티셔닝 고려 테이블 (Partitioned Table Design)
로그나 내역 테이블의 경우, 시간(`created_at`)을 기준으로 파티셔닝이 용이하도록 설계합니다.
Snowflake ID를 사용하는 경우, ID 자체에 시간 정보가 포함되어 있지만 명시적인 `created_at` 컬럼을 파티셔닝 키로 자주 사용합니다.

```prisma
model GameRoundLog {
  // Partitioning을 위해 PK에 created_at을 포함할 수도 있음 (Unique 제약조건 때문)
  // 또는 Snowflake ID만으로 PK를 잡고, created_at은 인덱스로 활용 (Partman 설정에 따라 다름)
  // 일반적인 시계열 파티셔닝 패턴:
  
  id        BigInt   @map("id") // Snowflake ID (Application Generated)
  gameId    BigInt   @map("game_id")
  betAmount Decimal  @map("bet_amount") @db.Decimal(20, 8)
  
  // 파티셔닝 기준 컬럼
  createdAt DateTime @default(now()) @map("created_at")

  // 복합 기본키 (Partitioning Key 포함 필요 시)
  @@id([id, createdAt]) 
  
  // 검색 성능을 위한 인덱스
  @@index([createdAt]) 
  @@map("game_round_logs")
}
```

## References
*   [Prisma Schema Reference](https://www.prisma.io/docs/orm/prisma-schema/overview)
