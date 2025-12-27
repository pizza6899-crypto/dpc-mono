#!/usr/bin/env node

import { CommandFactory } from 'nest-commander';
import { CliModule } from './cli.module';

async function bootstrap() {
  try {
    // CLI 모드 환경 변수 설정
    process.env.NODE_ENV = 'cli';
    process.env.ENABLE_SCHEDULER = 'false';

    await CommandFactory.run(CliModule);
  } catch (error) {
    console.error('CLI 실행 중 에러 발생:', error);
    process.exit(1);
  }
}

bootstrap();
