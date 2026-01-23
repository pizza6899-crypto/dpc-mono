import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { LockNamespace, CONCURRENCY_CONSTANTS } from './concurrency.constants';
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
     * @param options 추가 옵션 (throwThrottleError: true일 경우 429 에러용 메시지로 throw)
     */
    async acquireLock(
        namespace: LockNamespace,
        id: string | number,
        options?: { throwThrottleError?: boolean }
    ): Promise<void> {
        const key = this.generateKey(namespace, id);
        try {
            // 1. 세션 범위의 락 대기 시간 설정 (기본 3초)
            // Kysely/Prisma Adapter에서 SET 구문에 파라미터 바인딩($1) 사용 시 문법 에러가 발생하므로 raw string 처리
            await this.tx.$executeRawUnsafe(`SET LOCAL lock_timeout = '${CONCURRENCY_CONSTANTS.DB_LOCK_TIMEOUT}'`);

            // 2. 배타적 트랜잭션 어드바이저리 락 획득 (트랜잭션 종료 시 자동 해제)
            // queryRaw는 void 반환타입 역직렬화에 실패하므로 executeRaw 사용
            await this.tx.$executeRaw`SELECT pg_advisory_xact_lock(${key})`;
        } catch (error: any) {
            if (this.isLockTimeoutError(error)) {
                if (options?.throwThrottleError) {
                    throw new Error('CONCURRENCY_LOCK_TIMEOUT');
                }
            }
            throw error;
        }
    }

    /**
     * PostgreSQL lock_not_available (55P03) 또는 락 타임아웃 에러 여부 확인
     */
    private isLockTimeoutError(error: any): boolean {
        return (
            error.code === '55P03' ||
            error.meta?.code === '55P03' ||
            error.message?.includes('55P03') ||
            error.message?.includes('lock timeout')
        );
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
