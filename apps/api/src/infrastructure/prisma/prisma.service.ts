import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@repo/database';
import { PrismaPg } from '@prisma/adapter-pg';
import kyselyExtension, {
  PrismaKyselyExtensionArgs,
} from 'prisma-extension-kysely';

export type ExtendedClient = ReturnType<
  PrismaService['createExtendedClient']
>;
import {
  CamelCasePlugin,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  sql,
} from 'kysely';
import type { DB } from '@repo/database/src/kysely-types';

/**
 * Prisma 데이터베이스 서비스 (Kysely 확장 포함)
 *
 * PrismaClient를 확장하여 NestJS 모듈 생명주기와 통합합니다.
 * Kysely 확장을 통해 타입 안전한 raw SQL 쿼리를 지원합니다.
 *
 * @example
 * // 일반 Prisma 쿼리
 * const users = await prisma.user.findMany();
 *
 * @example
 * // Kysely 쿼리 (Prisma 엔진을 통해 실행)
 * const result = await prisma.$kysely
 *   .selectFrom('users')
 *   .select(['id', 'email'])
 *   .where('status', '=', 'ACTIVE')
 *   .execute();
 *
 * @example
 * // 트랜잭션에서 Kysely 사용
 * await prisma.$transaction(async (tx) => {
 *   await tx.$kysely
 *     .insertInto('users')
 *     .values({ id: '1', email: 'test@example.com' })
 *     .execute();
 * });
 */
@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions>
  implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private _extendedClient: ReturnType<typeof this.createExtendedClient> | null =
    null;

  constructor() {
    // DATABASE_URL 환경변수에서 연결 문자열 가져오기
    let connectionString = process.env.DATABASE_URL || '';

    // 환경 변수에 따옴표가 포함되어 있으면 제거 (Docker --env-file 이슈 대응)
    connectionString = connectionString.replace(/^["']|["']$/g, '');

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL is not defined in environment variables. Please set DATABASE_URL in your .env file.',
      );
    }

    // PostgreSQL 어댑터 생성
    const adapter = new PrismaPg({ connectionString });

    // PrismaClient 초기화
    super({
      adapter,
    });
  }

  /**
   * Kysely 확장이 적용된 클라이언트 생성
   */
  createExtendedClient() {
    this.logger.log('🔌 Creating extended client with Kysely extension...');

    const extensionArgs: PrismaKyselyExtensionArgs<DB> = {
      kysely: (driver) =>
        new Kysely<DB>({
          dialect: {
            createDriver: () => driver,
            createAdapter: () => new PostgresAdapter(),
            createIntrospector: (db) => new PostgresIntrospector(db),
            createQueryCompiler: () => new PostgresQueryCompiler(),
          },
          log: (event) => {
            if (event.level === 'error') {
              this.logger.error(
                `❌ Kysely Error: ${JSON.stringify(event.error)}`,
              );
            }
          },
          plugins: [new CamelCasePlugin()],
        }),
    };

    return this.$extends(kyselyExtension(extensionArgs));
  }

  /**
   * 모듈 초기화 시 데이터베이스 연결 및 Kysely 확장 적용
   */
  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('🚀 calls onModuleInit');
      // 1. Prisma 연결
      await this.$connect();
      this.logger.log('✅ Prisma connection established');

      // 2. Kysely 확장 적용 (중복 방지)
      if (!this._extendedClient) {
        try {
          this.logger.log('Tried to initialize Kysely extension...');
          this._extendedClient = this.createExtendedClient();
          this.logger.log('✅ Kysely extension initialized');
        } catch (extError) {
          this.logger.error(
            '❌ Failed to initialize Kysely extension',
            extError,
          );
          throw extError;
        }
      } else {
        this.logger.log('ℹ️ Extended client already exists');
      }

      // 3. 연결 테스트 (Health Check)
      // Prisma Ping
      const prismaStart = Date.now();
      await this.$queryRaw`SELECT 1`;
      const prismaDuration = Date.now() - prismaStart;
      this.logger.log(`✅ Prisma query test successful (${prismaDuration}ms)`);

      // Kysely Ping
      if (this._extendedClient) {
        this.logger.log('🧪 Starting Kysely test query...');
        try {
          const kyselyStart = Date.now();
          // SELECT 1 쿼리 실행
          const result = await sql`SELECT 1 as val`.execute(
            this._extendedClient.$kysely,
          );
          const kyselyDuration = Date.now() - kyselyStart;
          this.logger.log(
            `✅ Kysely query test successful (${kyselyDuration}ms) via Prisma Engine. Result: ${JSON.stringify(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (result as any).rows,
            )}`,
          );
        } catch (e) {
          this.logger.error('❌ Kysely test query failed', e);
        }
      } else {
        this.logger.warn(
          '⚠️ Cannot run Kysely test: _extendedClient is null',
        );
      }
    } catch (error) {
      this.logger.error(
        '❌ Failed to connect to database or execute test queries',
        error,
      );
      throw error;
    }
  }

  /**
   * 모듈 종료 시 데이터베이스 연결 해제
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
      this.logger.log('Database connection closed');
    } catch (error) {
      this.logger.error('Error disconnecting from database', error);
    }
  }

  /**
   * Kysely 쿼리 빌더 반환
   *
   * Prisma의 내장 엔진을 통해 실행되므로:
   * - 동일한 연결 풀 사용
   * - 트랜잭션 공유 가능 (prisma.$transaction 내에서 tx.$kysely 사용)
   *
   * @example
   * const users = await prisma.kysely
   *   .selectFrom('users')
   *   .innerJoin('user_wallets', 'user_wallets.user_id', 'users.id')
   *   .select(['users.email', 'user_wallets.balance'])
   *   .where('users.status', '=', 'ACTIVE')
   *   .execute();
   */
  get kysely() {
    if (!this._extendedClient) {
      throw new Error(
        'PrismaService not initialized. Ensure onModuleInit has been called.',
      );
    }
    return this._extendedClient.$kysely;
  }

  /**
   * $transaction 오버라이드
   *
   * nestjs-cls가 트랜잭션을 시작할 때 이 메서드를 호출합니다.
   * 이때 확장된 클라이언트(extended client)의 $transaction을 호출해야
   * 트랜잭션 내에서 Kysely($kysely)를 사용할 수 있습니다.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override async $transaction(...args: any[]) {
    // 확장 클라이언트가 준비되었으면 그것을 사용
    if (this._extendedClient) {
      // eslint-disable-next-line @typescript-eslint/ban-types
      return (this._extendedClient as any).$transaction(...args);
    }
    // 아니면 기본 동작 (하지만 onModuleInit에서 초기화되므로 이럴 일은 거의 없음)
    // eslint-disable-next-line @typescript-eslint/ban-types
    return super.$transaction.apply(this, args as [any]);
  }

  /**
   * Kysely 확장이 적용된 전체 클라이언트 반환
   * 트랜잭션에서 사용할 때 필요합니다.
   */
  get extended() {
    if (!this._extendedClient) {
      throw new Error(
        'PrismaService not initialized. Ensure onModuleInit has been called.',
      );
    }
    return this._extendedClient;
  }
}
