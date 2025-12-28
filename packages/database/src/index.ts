// packages/database/src/index.ts
// client.ts가 이미 모든 것을 export하므로 (enums, PrismaClient, Prisma namespace 등)
// models.ts의 타입들도 함께 export
// 
// Note: Prisma가 생성한 파일들은 .js 확장자를 사용하므로 일관성을 유지합니다.
// TypeScript 컴파일러는 .js 확장자를 .ts 파일로 자동 해석합니다.
export * from './client/client.js';
export * from './client/models.js';