// packages/database/src/index.ts
// Prisma client의 모든 export를 re-export하는 barrel file
// client/index.ts가 이미 모든 것을 export하므로 (PrismaClient, Prisma namespace, models, enums 등)
// 여기서는 client/index를 통해 모든 것을 re-export합니다.
//
// Note: Prisma가 생성한 파일들은 .js 확장자를 사용하므로 일관성을 유지합니다.
// TypeScript 컴파일러는 .js 확장자를 .ts 파일로 자동 해석합니다.
export * from './client/index.js';