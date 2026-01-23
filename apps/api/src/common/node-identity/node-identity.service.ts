import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { RedisService } from 'src/infrastructure/redis/redis.service';
import { randomUUID } from 'crypto';
import * as os from 'os';

@Injectable()
export class NodeIdentityService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(NodeIdentityService.name);
    private readonly nodeKeyPrefix = 'infra:nodes:';
    private readonly maxNodes = 1024;
    private readonly heartbeatIntervalMs = 10000;
    private readonly ttlSeconds = 30;

    private readonly instanceUuid: string;
    private readonly hostname: string;
    private nodeId: number;
    private heartbeatTimer: NodeJS.Timeout;
    private isInitialized = false;

    constructor(
        private readonly redisService: RedisService,
    ) {
        this.hostname = os.hostname();
        this.instanceUuid = randomUUID();
    }

    async onModuleInit() {
        if (this.isInitialized) return;

        try {
            await this.assignNodeIdWithRetry(3);
            this.startHeartbeat();
            this.isInitialized = true;
        } catch (error) {
            this.logger.error('CRITICAL: Failed to initialize NodeIdentityService.', error);
            throw error;
        }
    }

    async onModuleDestroy() {
        if (this.nodeId !== undefined) {
            clearInterval(this.heartbeatTimer);
            try {
                // 안전한 삭제: 내가 점유한 UUID가 맞을 때만 삭제
                const script = `
                    if redis.call("get", KEYS[1]) == ARGV[1] then
                        return redis.call("del", KEYS[1])
                    else
                        return 0
                    end
                `;
                await this.redisService.getClient().eval(script, 1, `${this.nodeKeyPrefix}${this.nodeId}`, this.instanceUuid);
                this.logger.log(`Node ID [${this.nodeId}] released successfully.`);
            } catch (error) {
                this.logger.warn(`Failed to release Node ID [${this.nodeId}] gracefully.`);
            }
        }
    }

    /**
     * Snowflake 등을 위한 정수 노드 ID 반환 (0-1023)
     */
    getNodeId(): number {
        if (this.nodeId === undefined) {
            throw new Error('Node ID is requested before assignment.');
        }
        return this.nodeId;
    }

    /**
     * 운영 가시성을 위한 문자열 식별자 반환
     * 형식: node-{id}-{hostname}-{shortUuid}
     */
    getDisplayId(): string {
        return `node-${this.getNodeId()}-${this.hostname}-${this.instanceUuid.split('-')[0]}`;
    }

    private async assignNodeIdWithRetry(retries: number) {
        for (let i = 0; i < retries; i++) {
            try {
                await this.assignNodeId();
                return;
            } catch (error) {
                if (i === retries - 1) throw error;
                this.logger.warn(`Node ID assignment failed, retrying... (${i + 1}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

    /**
     * Lua Script를 사용하여 원자적으로 비어있는 ID를 찾아 점유합니다.
     */
    private async assignNodeId() {
        const script = `
            local prefix = ARGV[1]
            local max_nodes = tonumber(ARGV[2])
            local uuid = ARGV[3]
            local ttl = ARGV[4]

            for i = 0, max_nodes - 1 do
                local key = prefix .. i
                if redis.call("set", key, uuid, "NX", "EX", ttl) then
                    return i
                end
            end
            return -1
        `;

        const result = await this.redisService.getClient().eval(
            script,
            0,
            this.nodeKeyPrefix,
            this.maxNodes,
            this.instanceUuid,
            this.ttlSeconds
        );

        const assignedId = Number(result);
        if (assignedId === -1) {
            throw new Error('All Node IDs are currently occupied in Redis.');
        }

        this.nodeId = assignedId;
        this.logger.log(`[NodeIdentity] Atomic ID assigned: ${this.getDisplayId()}`);
    }

    private startHeartbeat() {
        this.heartbeatTimer = setInterval(async () => {
            try {
                const key = `${this.nodeKeyPrefix}${this.nodeId}`;
                const script = `
                    if redis.call("get", KEYS[1]) == ARGV[1] then
                        return redis.call("expire", KEYS[1], ARGV[2])
                    else
                        return 0
                    end
                `;

                const result = await this.redisService.getClient().eval(
                    script,
                    1,
                    key,
                    this.instanceUuid,
                    this.ttlSeconds
                );

                if (result === 0) {
                    this.logger.error(`CRITICAL: Ownership lost for ${this.getDisplayId()}! Re-occupying...`);
                    // 재점유 시도 (기존 ID 그대로 시도)
                    const reAcquired = await this.redisService.setLock(key, this.instanceUuid, this.ttlSeconds);
                    if (!reAcquired) {
                        this.logger.fatal(`FATAL: Node ID [${this.nodeId}] stolen! ID collision risk.`);
                    }
                }
            } catch (error) {
                this.logger.error(`Heartbeat fail for ${this.getDisplayId()}`, error);
            }
        }, this.heartbeatIntervalMs);
    }
}
