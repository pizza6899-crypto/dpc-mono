import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@repo/database';
import { PrismaPg } from '@prisma/adapter-pg';
import { extension } from '@repo/database/kysely';

/**
 * Prisma 데이터베이스 서비스
 *
 * PrismaClient를 확장하여 NestJS 모듈 생명주기와 통합합니다.
 * PostgreSQL 어댑터를 사용하여 연결을 관리합니다.
 */
@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions>
  implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  // Kysely 확장 클라이언트 타입을 유추하거나 any로 설정 (필요시 구체적 타입 정의)
  public readonly $extended: any;

  constructor() {
    // DATABASE_URL 환경변수에서 연결 문자열 가져오기
    let connectionString = process.env.DATABASE_URL || '';

    // 환경 변수에 따옴표가 포함되어 있으면 제거 (Docker --env-file 이슈 대응)
    const originalConnectionString = connectionString;
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

    // Kysely 확장 등록 (database 패키지에서 제공하는 확장 사용)
    this.$extended = this.$extends(extension());
  }

  /**
   * 모듈 초기화 시 데이터베이스 연결
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Database connection established');

      if (this.$extended && this.$extended.$kysely) {
        this.logger.log('Kysely extension initialized successfully');
        // 간단한 쿼리 실행으로 동작 확인 (선택 사항)
        // await this.$extended.$kysely.selectFrom('User').select('id').limit(1).execute();
      } else {
        this.logger.warn('Kysely extension NOT initialized');
      }
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
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
      // 연결 해제 실패는 치명적이지 않으므로 예외를 다시 throw하지 않음
    }
  }
}
