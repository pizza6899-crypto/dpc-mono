import { Injectable, Logger } from '@nestjs/common';
import { NodeIdentityService } from '../node-identity/node-identity.service';

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

    // 시퀀스 관리
    private sequence = 0n;
    private lastTimestamp = -1n;

    constructor(
        private readonly nodeIdentityService: NodeIdentityService,
    ) { }

    /**
     * 할당된 Node ID를 반환합니다.
     */
    getNodeId(): bigint {
        return BigInt(this.nodeIdentityService.getNodeId());
    }

    /**
     * 특정 타임스탬프를 기준으로 Snowflake ID를 생성합니다.
     * DB 레코드 생성 시 ID와 시간을 함께 처리하기 위해 타임스탬프를 명시적으로 받습니다.
     * 
     * @param {Date | bigint | number} targetTime - ID에 심을 대상 시간
     * @returns {bigint} 생성된 Snowflake ID
     * 
     * @example
     * // 현재 시간 기준 ID 생성
     * const now = new Date();
     * const id = snowflakeService.generate(now);
     * await prisma.create({ id, createdAt: now });
     * 
     * @example
     * // 특정 시간 기준 ID 생성 (외부 이벤트 시간 반영)
     * const wonAt = new Date(externalEvent.timestamp);
     * const id = snowflakeService.generate(wonAt);
     * await prisma.create({ id, wonAt });
     */
    generate(targetTime: Date | bigint | number): bigint {
        let timestamp: bigint;
        if (targetTime instanceof Date) {
            timestamp = BigInt(targetTime.getTime());
        } else {
            timestamp = BigInt(targetTime);
        }

        return this.internalGenerate(timestamp);
    }

    /**
     * 내부적으로 타임스탬프와 시퀀스를 관리하며 ID를 생성합니다.
     */
    private internalGenerate(timestamp: bigint): bigint {
        // 과거 타임스탬프가 명시적으로 들어온 경우
        if (timestamp < this.lastTimestamp) {
            this.logger.warn(
                `Generating ID for past timestamp (${timestamp}) after future timestamp (${this.lastTimestamp}). ` +
                `Sequence reset to 0. Potential ID collision risk if same timestamp is reused.`
            );
            this.sequence = 0n;
        } else if (timestamp === this.lastTimestamp) {
            // 같은 밀리초 내에서 호출된 경우 시퀀스 증가
            this.sequence = (this.sequence + 1n) & this.SEQUENCE_MASK;

            // 시퀀스 오버플로우 발생 (4096번 초과)
            if (this.sequence === 0n) {
                // 현재 시간 기준 생성인지 확인 (±10ms 허용)
                const currentTime = BigInt(Date.now());
                const isRealtimeGeneration = timestamp >= currentTime - 10n && timestamp <= currentTime + 10n;

                if (isRealtimeGeneration) {
                    // 실시간 생성: 다음 밀리초까지 대기
                    this.logger.warn(`Sequence overflow. Waiting for next millisecond.`);
                    timestamp = this.waitNextMillis(this.lastTimestamp);
                } else {
                    // 고정 타임스탬프 생성: 에러 발생 (무한 루프 방지)
                    throw new Error(
                        `Sequence overflow for fixed timestamp: ${timestamp}. ` +
                        `Cannot generate more than 4096 IDs for the same millisecond.`
                    );
                }
            }
        } else {
            // 새로운 밀리초인 경우 시퀀스 초기화
            this.sequence = 0n;
        }

        this.lastTimestamp = timestamp;

        return this.buildId(timestamp, this.sequence);
    }

    /**
     * 타임스탬프, 노드 ID, 시퀀스를 조합하여 64비트 ID를 빌드합니다.
     */
    private buildId(timestamp: bigint, sequence: bigint): bigint {
        return ((timestamp - this.EPOCH) << this.TIMESTAMP_SHIFT) |
            (this.getNodeId() << this.NODE_ID_SHIFT) |
            (sequence & this.SEQUENCE_MASK);
    }

    /**
     * 현재 타임스탬프를 밀리초 단위로 반환합니다.
     */
    private getCurrentTimestamp(): bigint {
        return BigInt(Date.now());
    }

    /**
     * 다음 밀리초까지 대기합니다.
     */
    private waitNextMillis(lastTimestamp: bigint): bigint {
        let timestamp = this.getCurrentTimestamp();
        while (timestamp <= lastTimestamp) {
            timestamp = this.getCurrentTimestamp();
        }
        return timestamp;
    }

    /**
     * Snowflake ID를 파싱하여 구성 요소를 반환합니다.
     * 디버깅 및 분석 용도로 사용합니다.
     * 
     * @param {bigint} id - 파싱할 Snowflake ID
     * @returns {{ timestamp: bigint; nodeId: bigint; sequence: bigint; date: Date }}
     */
    parse(id: bigint): {
        timestamp: bigint;
        nodeId: bigint;
        sequence: bigint;
        date: Date;
    } {
        const timestamp =
            (id >> this.TIMESTAMP_SHIFT) + this.EPOCH;
        const nodeId = (id >> this.NODE_ID_SHIFT) & this.NODE_ID_MASK;
        const sequence = id & this.SEQUENCE_MASK;

        return {
            timestamp,
            nodeId,
            sequence,
            date: new Date(Number(timestamp)),
        };
    }
}
