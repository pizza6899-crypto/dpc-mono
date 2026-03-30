import { Injectable, Logger } from '@nestjs/common';
import { NodeIdentityService } from 'src/infrastructure/node-identity/node-identity.service';
import { SnowflakeClockBackwardsException } from './snowflake.exception';

export interface GeneratedSnowflake {
  id: bigint;
  timestamp: Date;
}

@Injectable()
export class SnowflakeService {
  private readonly logger = new Logger(SnowflakeService.name);

  // 커스텀 에포크: 2026-01-01 00:00:00 UTC (밀리초)
  private readonly EPOCH = 1767225600000n;

  // 비트 시프트 값
  private readonly NODE_ID_SHIFT = 12n;
  private readonly TIMESTAMP_SHIFT = 22n;

  // 비트 마스크
  private readonly SEQUENCE_MASK = 0xfffn; // 12 bits (4095)
  private readonly NODE_ID_MASK = 0x3ffn; // 10 bits (1023)

  // 외부 주입 시각용 노드 오프셋 (Bit 9를 1로 설정하여 512~1023 범위 사용)
  private readonly EXTERNAL_NODE_OFFSET = 512n;

  // 시퀀스 관리 (실시간/내부 생성용)
  private sequence = 0n;
  private lastTimestamp = -1n;

  // 외부 주입용 시퀀스 저장소 (최근 1000개의 밀리초별 시퀀스 기억)
  private readonly externalSequenceMap = new Map<bigint, bigint>();

  constructor(private readonly nodeIdentityService: NodeIdentityService) {}

  private getNodeId(): bigint {
    return BigInt(this.nodeIdentityService.getNodeId()) & 0x1ffn; // 하위 9비트(0~511)만 사용
  }

  /**
   * Snowflake ID와 생성에 사용된 정확한 타임스탬프를 함께 반환합니다.
   *
   * @param targetTime - 외부 타임스탬프 (생략 시 현재 시스템 시각 사용)
   * @returns {GeneratedSnowflake} - { id, timestamp }
   */
  generate(targetTime?: Date | bigint | number): GeneratedSnowflake {
    let timestamp: bigint;
    let isExternal = false;

    if (targetTime === undefined) {
      // 인자 없음: 실시간 내부 생성 -> 내부 노드(0~511) 사용
      timestamp = BigInt(Date.now());
    } else {
      // 인자 있음: 외부 주입 생성 -> 외부 노드(512~1023) 사용
      timestamp =
        typeof targetTime === 'object'
          ? BigInt(targetTime.getTime())
          : BigInt(targetTime);
      isExternal = true;
    }

    // 모드에 따라 생성 로직 분기
    const id = isExternal
      ? this.generateExternal(timestamp)
      : this.internalGenerate(timestamp);

    return {
      id,
      timestamp: new Date(Number(timestamp)),
    };
  }

  /**
   * 외부 시스템 시각(External Event Time)을 위한 ID 생성
   * 네트워크 지연으로 인해 동일 밀리초 데이터가 뒤섞여 들어와도 중복을 방지합니다.
   */
  private generateExternal(timestamp: bigint): bigint {
    const nodeId = this.getNodeId() | this.EXTERNAL_NODE_OFFSET;

    // 최근 해당 타임스탬프로 생성한 시퀀스가 있는지 확인
    const currentSeq = this.externalSequenceMap.get(timestamp) ?? -1n;
    const nextSeq = (currentSeq + 1n) & this.SEQUENCE_MASK;

    // 시퀀스 상태 업데이트
    this.externalSequenceMap.set(timestamp, nextSeq);

    // LRU 정책: 최근 1000개의 타임스탬프 상태만 유지 (메모리 관리)
    if (this.externalSequenceMap.size > 1000) {
      const firstKey = this.externalSequenceMap.keys().next().value;
      this.externalSequenceMap.delete(firstKey);
    }

    return this.buildIdWithNode(timestamp, nextSeq, nodeId);
  }

  private internalGenerate(timestamp: bigint): bigint {
    // 시계가 뒤로 돌아간 경우 (Clock Skew)
    if (timestamp < this.lastTimestamp) {
      const diff = this.lastTimestamp - timestamp;
      if (diff < 2000n) {
        this.logger.warn(`Clock moved backwards by ${diff}ms. Waiting...`);
        timestamp = this.waitNextMillis(this.lastTimestamp);
      } else {
        throw new SnowflakeClockBackwardsException(diff);
      }
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & this.SEQUENCE_MASK;
      if (this.sequence === 0n) {
        timestamp = this.waitNextMillis(this.lastTimestamp);
      }
    } else {
      this.sequence = 0n;
    }

    this.lastTimestamp = timestamp;
    return this.buildIdWithNode(timestamp, this.sequence, this.getNodeId());
  }

  private buildIdWithNode(
    timestamp: bigint,
    sequence: bigint,
    nodeId: bigint,
  ): bigint {
    return (
      ((timestamp - this.EPOCH) << this.TIMESTAMP_SHIFT) |
      (nodeId << this.NODE_ID_SHIFT) |
      (sequence & this.SEQUENCE_MASK)
    );
  }

  private waitNextMillis(lastTimestamp: bigint): bigint {
    let timestamp = BigInt(Date.now());
    while (timestamp <= lastTimestamp) {
      timestamp = BigInt(Date.now());
    }
    return timestamp;
  }

  parse(id: bigint) {
    const timestamp = (id >> this.TIMESTAMP_SHIFT) + this.EPOCH;
    const nodeId = (id >> this.NODE_ID_SHIFT) & this.NODE_ID_MASK;
    const isExternal = (nodeId & this.EXTERNAL_NODE_OFFSET) !== 0n;

    return {
      timestamp,
      date: new Date(Number(timestamp)),
      nodeId: isExternal ? nodeId ^ this.EXTERNAL_NODE_OFFSET : nodeId,
      isExternal,
      sequence: id & this.SEQUENCE_MASK,
    };
  }
}
