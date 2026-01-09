# Snowflake ID 사용 가이드

## 개요
`SnowflakeModule`은 분산 환경에서 고유한 ID를 생성하기 위한 모듈입니다.
Twitter Snowflake 알고리즘을 사용하여 시간 순서가 보장되는 64비트 정수 ID를 생성합니다.

## 설치 및 설정

### 1. 환경 변수 (선택 사항)
PM2를 사용하는 경우, 각 인스턴스는 자동으로 `NODE_APP_INSTANCE` 환경 변수를 통해 고유한 노드 ID를 할당받습니다.

```bash
# PM2 사용 시 자동 설정됨
NODE_APP_INSTANCE=0  # 첫 번째 인스턴스
NODE_APP_INSTANCE=1  # 두 번째 인스턴스
```

단일 인스턴스 환경에서는 별도 설정이 필요 없습니다 (기본값: 0).

### 2. 모듈 Import
`SnowflakeModule`은 이미 `AppModule`에 전역으로 등록되어 있으므로, 별도의 import 없이 바로 사용할 수 있습니다.

만약 특정 모듈에서만 사용하고 싶다면:

```typescript
import { Module } from '@nestjs/common';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';

@Module({
  imports: [SnowflakeModule],
  providers: [YourService],
})
export class YourModule {}
```

## 사용 방법

### 기본 사용
```typescript
import { Injectable } from '@nestjs/common';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';

@Injectable()
export class YourService {
  constructor(private readonly snowflakeService: SnowflakeService) {}

  async createSomething() {
    // Snowflake ID 생성
    const id = this.snowflakeService.nextId();
    console.log(id); // 예: 123456789012345678n

    // DB에 저장 (Prisma BigInt 타입)
    await this.prisma.yourModel.create({
      data: {
        id, // bigint 타입
        name: 'example',
      },
    });

    return id;
  }
}
```

### Repository에서 사용
```typescript
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';

@Injectable()
export class YourRepository {
  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
    private readonly snowflakeService: SnowflakeService,
  ) {}

  async create(entity: YourEntity): Promise<YourEntity> {
    const id = this.snowflakeService.nextId();

    const result = await this.tx.yourModel.create({
      data: {
        id,
        ...entity,
      },
    });

    return this.mapper.toDomain(result);
  }
}
```

### ID 파싱 (디버깅/분석용)
```typescript
const id = this.snowflakeService.nextId();
const parsed = this.snowflakeService.parse(id);

console.log(parsed);
// {
//   timestamp: 1704067200123n,
//   nodeId: 0n,
//   sequence: 42n,
//   date: 2024-01-01T00:00:00.123Z
// }
```

## ID 구조

Snowflake ID는 64비트로 구성됩니다:

```
┌─────────────────────────────────────────────┬──────────────┬──────────────┐
│          Timestamp (41 bits)                │ Node (10 bits)│ Seq (12 bits)│
│  2024-01-01 기준 밀리초                      │   0-1023      │   0-4095     │
└─────────────────────────────────────────────┴──────────────┴──────────────┘
```

- **Timestamp (41 bits)**: 2024-01-01 00:00:00 UTC 기준 밀리초 (약 69년 사용 가능)
- **Node ID (10 bits)**: 노드 식별자 (0-1023, PM2 인스턴스 번호 사용)
- **Sequence (12 bits)**: 동일 밀리초 내 시퀀스 (0-4095, 밀리초당 최대 4096개 ID 생성 가능)

## 성능 특성

- **처리량**: 단일 노드에서 밀리초당 최대 4,096개 ID 생성 가능
- **확장성**: 최대 1,024개 노드에서 동시 사용 가능
- **순서 보장**: 생성된 ID는 시간 순서대로 증가
- **충돌 없음**: 노드 ID와 시퀀스를 통해 분산 환경에서도 충돌 없음

## 주의사항

### 1. 시계 역행
시스템 시계가 역행하면 ID 생성이 실패합니다. NTP 동기화를 권장합니다.

```typescript
try {
  const id = this.snowflakeService.nextId();
} catch (error) {
  // "Clock moved backwards" 에러 처리
  this.logger.error('Failed to generate Snowflake ID', error);
}
```

### 2. PM2 클러스터 모드
PM2 클러스터 모드를 사용하는 경우, 각 인스턴스는 자동으로 고유한 `NODE_APP_INSTANCE`를 할당받습니다.

```bash
# PM2 설정 예시 (ecosystem.config.js)
module.exports = {
  apps: [{
    name: 'api',
    script: './dist/main.js',
    instances: 4,  // 4개 인스턴스 (NODE_APP_INSTANCE: 0, 1, 2, 3)
    exec_mode: 'cluster',
  }]
};
```

### 3. 데이터베이스 스키마
Prisma 스키마에서 `BigInt` 타입을 사용해야 합니다:

```prisma
model YourModel {
  id BigInt @id @default(autoincrement())
  // 또는 애플리케이션 레벨에서 생성
  id BigInt @id
}
```

## 언제 사용해야 하나?

### ✅ 사용 권장
- 분산 환경에서 고유 ID가 필요한 경우
- 시간 순서가 중요한 경우 (로그, 이벤트 등)
- DB의 Auto Increment를 사용할 수 없는 경우
- 샤딩된 데이터베이스 환경

### ❌ 사용 비권장
- 단일 서버 환경에서 간단한 ID만 필요한 경우 → `IdUtil.generateUid()` (CUID2) 사용
- 외부에 노출되는 ID (보안상 시간 정보 노출 우려) → CUID2 사용
- 매우 높은 처리량이 필요한 경우 (밀리초당 4096개 초과) → UUID v7 고려

## 예시: 주문 ID 생성

```typescript
@Injectable()
export class OrderService {
  constructor(
    private readonly snowflakeService: SnowflakeService,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryPort,
  ) {}

  async createOrder(userId: string, items: OrderItem[]): Promise<Order> {
    // Snowflake ID로 주문 ID 생성
    const orderId = this.snowflakeService.nextId();

    const order = Order.create({
      id: orderId,
      userId,
      items,
      createdAt: new Date(),
    });

    return await this.orderRepository.create(order);
  }

  async getOrdersByTimeRange(startTime: Date, endTime: Date): Promise<Order[]> {
    // Snowflake ID는 시간 정보를 포함하므로, ID 범위로 조회 가능
    // (성능 최적화)
    const startId = this.timeToSnowflakeId(startTime);
    const endId = this.timeToSnowflakeId(endTime);

    return await this.orderRepository.findByIdRange(startId, endId);
  }

  private timeToSnowflakeId(date: Date): bigint {
    const EPOCH = 1704067200000n;
    const timestamp = BigInt(date.getTime());
    return (timestamp - EPOCH) << 22n; // 최소 ID
  }
}
```

## 참고 자료
- [Twitter Snowflake 원본 문서](https://github.com/twitter-archive/snowflake/tree/snowflake-2010)
- [분산 ID 생성 전략 비교](https://blog.twitter.com/engineering/en_us/a/2010/announcing-snowflake)
