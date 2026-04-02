---
name: snowflake_id_generation
description: Snowflake ID 생성 및 파싱 가이드 (분산 고유 ID 생성기)
---

# Snowflake ID Generation Skill

이 스킬은 분산 시스템 환경에서 64비트 고유 ID를 생성하는 `SnowflakeService`의 사용법과 원칙을 설명합니다.

## 1. 개요
Snowflake ID는 시간 순서대로 정렬 가능한 64비트 정수형 ID입니다.
- **Timestamp (41 bits)**: 기준 시점(EPOCH)으로부터의 밀리초 (약 69년 사용 가능)
- **Node ID (10 bits)**: 최대 1024개의 서버 노드 식별
- **Sequence (12 bits)**: 동일 밀리초 내에서 생성되는 ID 순서 (최대 4096개)

## 2. 사용 방법

### 2.1. 모듈 임포트
`SnowflakeModule`을 필요한 모듈의 `imports` 배열에 추가합니다.

```typescript
@Module({
  imports: [SnowflakeModule],
  // ...
})
export class MyModule {}
```

### 2.2. ID 생성 (`generate`)
현재 시간 혹은 특정 시간을 기준으로 고유 ID를 생성합니다.

```typescript
constructor(private readonly snowflakeService: SnowflakeService) {}

async createOrder() {
  const now = new Date();
  const id = this.snowflakeService.generate(now); // bigint 반환
  
  // 데이터베이스 저장 시 bigint 타입으로 저장 (Prisma의 경우 BigInt)
  await this.repository.save({ id, createdAt: now });
}
```

### 2.3. ID 파싱 (`parse`)
생성된 ID로부터 시간, 노드 ID, 시퀀스 정보를 다시 추출합니다.

```typescript
const info = this.snowflakeService.parse(id);
console.log(info.date);      // ID가 생성된 시각 (Date 객체)
console.log(info.nodeId);    // ID를 생성한 서버 노드 ID
console.log(info.sequence);  // 동일 밀리초 내 시퀀스 번호
```

## 3. 구현 원칙 및 주의사항

1. **시간 역행 방지**: 시스템 시계가 과거로 돌아가면 ID 중복 위험이 있으므로 `SnowflakeClockBackwardsException`을 발생시킵니다.
2. **시퀀스 오버플로우**: 동일 밀리초 내에 4096개 이상의 ID 생성을 시도할 경우:
   - 실시간 생성 시: 다음 밀리초까지 대기(Wait) 후 생성합니다.
   - 고정 시간 전달 시: 예외를 발생시켜 무한 루프를 방지합니다.
3. **BigInt 처리**: JavaScript의 `number` 범위를 넘어서므로 항상 `bigint` 타입을 사용하고, JSON 직렬화 시 문자열로 변환해야 함에 유의하십시오.
4. **기준 시점 (EPOCH)**: 현재 프로젝트는 `2026-01-01 00:00:00 UTC`를 기준으로 설정되어 있습니다.
