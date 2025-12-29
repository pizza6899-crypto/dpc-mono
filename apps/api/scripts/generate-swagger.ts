import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

async function generate() {
  // 인프라(DB 등) 연결 없이 모듈만 로드 (가벼움)
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('DPC Backend API')
    .setDescription('DPC Backend API 문서')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // 🔥 핵심: 모노레포 루트 경로 지정
  // apps/api/scripts에서 실행되므로, 모노레포 루트는 ../../ 입니다
  // process.cwd()는 명령어 실행 위치이므로, apps/api에서 실행하면 apps/api가 됩니다
  const rootPath = path.resolve(process.cwd(), '../../swagger.json');

  fs.writeFileSync(rootPath, JSON.stringify(document, null, 2));

  console.log(`🚀 Swagger Spec exported to: ${rootPath}`);
  await app.close();
}

generate().catch((error) => {
  console.error('❌ Swagger 문서 생성 중 오류 발생:', error);
  process.exit(1);
});

