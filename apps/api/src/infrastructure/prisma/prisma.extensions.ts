// prisma.extensions.ts
import { Prisma } from '@repo/database';

export const extendedPrismaClient = (client: Prisma.DefaultPrismaClient) => {
  return client.$extends({
    // 1. 결과값 변환 (결과를 받을 때 자동으로 String으로 변환)
    result: {
      $allModels: {
        // 모든 모델의 id(BigInt) 필드를 String으로 변환해서 반환
        // (주의: 필드명이 id인 것만 골라서 하거나, 모델별로 지정 가능)
      }
    },
    // 2. 쿼리 결과 자체를 커스터마이징 (더 강력한 방법)
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const result = await query(args);

          // 결과 데이터에서 BigInt를 찾아 String으로 재귀적 변환
          return serializeBigInt(result);
        },
      },
    },
  });
};

/**
 * 객체 내의 모든 BigInt를 String으로 변환하는 유틸리티
 */
function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, serializeBigInt(value)])
    );
  }
  return obj;
}