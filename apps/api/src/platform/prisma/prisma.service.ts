import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@repo/database';
import { PrismaPg } from '@prisma/adapter-pg';
import { EnvService } from '../env/env.service';
import { nowUtc } from 'src/utils/date.util';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query'>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly envService: EnvService) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    const adapter = new PrismaPg({ connectionString });

    // 1. 어댑터와 로그 설정을 함께 전달
    super({
      adapter,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });

    const prismaConfig = this.envService.prisma;

    if (
      prismaConfig.queryLoggingEnabled &&
      prismaConfig.slowQueryThresholdMs > 0
    ) {
      this.$on('query', (e: Prisma.QueryEvent) => {
        // 2. 순환 참조 방지: 로그 저장용 테이블에 대한 쿼리는 무시
        if (
          e.query.includes('"PrismaQueryLog"') ||
          e.query.includes('prisma_query_logs')
        ) {
          return;
        }

        if (e.duration >= prismaConfig.slowQueryThresholdMs) {
          this.saveSlowQuery({
            query: e.query,
            params: e.params,
            duration: e.duration,
          });
        }
      });
    }
  }

  private async saveSlowQuery(data: {
    query: string;
    params: string;
    duration: number;
  }): Promise<void> {
    try {
      await this.prismaQueryLog.create({
        data: {
          query: data.query,
          params: this.parseParams(data.params),
          duration: data.duration,
          createdAt: nowUtc(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to save slow query log: ${error.message}`,
        error.stack,
      );
    }
  }

  private parseParams(params: string): any {
    try {
      return JSON.parse(params);
    } catch {
      return params;
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
