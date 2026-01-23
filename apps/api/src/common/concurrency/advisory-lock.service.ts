import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { LockNamespace } from './concurrency.constants';
import * as crypto from 'crypto';

@Injectable()
export class AdvisoryLockService {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
    ) { }

    /**
     * [Advisory] 트랜잭션 범위 내에서 배타적 락을 획득합니다. (Blocking)
     * 락을 획득할 때까지 대기하며, 획득한 락은 트랜잭션이 종료될 때 자동으로 해제됩니다.
     * 
     * @param namespace 락 종류 (LockNamespace)
     * @param id 대상 식별자 (string 또는 number)
     */
    async acquireLock(namespace: LockNamespace, id: string | number): Promise<void> {
        const key = this.generateKey(namespace, id);
        // pg_advisory_xact_lock: 트랜잭션 레벨 락 (Blocking)
        await sql`SELECT pg_advisory_xact_lock(${key})`.execute(this.tx.$kysely);
    }

    /**
     * [Advisory] 트랜잭션 락 획득을 시도합니다. (Non-blocking)
     * 이미 다른 세션이 점유 중이라면 기다리지 않고 즉시 false를 반환합니다.
     * 
     * @param namespace 락 종류 (LockNamespace)
     * @param id 대상 식별자
     * @returns true: 획득 성공 / false: 이미 점유됨
     */
    async tryAcquireLock(namespace: LockNamespace, id: string | number): Promise<boolean> {
        const key = this.generateKey(namespace, id);
        // pg_try_advisory_xact_lock: 트랜잭션 레벨 락 시도 (Non-blocking)
        const result = await sql<{ locked: boolean }>`
            SELECT pg_try_advisory_xact_lock(${key}) as locked
        `.execute(this.tx.$kysely);

        return result.rows[0]?.locked ?? false;
    }

    /**
     * [Helper] 네임스페이스와 ID를 조합하여 PostgreSQL 빅인트 호환 해시 키 생성
     * MD5 해시의 앞 16자리를 사용하여 64비트 정수를 생성합니다.
     */
    private generateKey(namespace: LockNamespace, id: string | number): bigint {
        const input = `${namespace}:${id}`;
        const hash = crypto.createHash('md5').update(input).digest('hex');

        // 앞 16자리 (64비트)만 사용 -> BigInt 변환
        const high = BigInt('0x' + hash.substring(0, 16));

        // Signed 64-bit Integer로 변환 (PostgreSQL bigint 호환)
        return BigInt.asIntN(64, high);
    }
}
