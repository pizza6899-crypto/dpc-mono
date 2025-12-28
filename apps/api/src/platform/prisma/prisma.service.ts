import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@repo/database';
import { PrismaPg } from '@prisma/adapter-pg';
import { EnvService } from '../env/env.service';

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

  constructor(private readonly envService: EnvService) {
    // DATABASE_URL 환경변수에서 연결 문자열 가져오기
    const connectionString = process.env.DATABASE_URL;
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
   * 모듈 초기화 시 데이터베이스 연결
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Database connection established');
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
