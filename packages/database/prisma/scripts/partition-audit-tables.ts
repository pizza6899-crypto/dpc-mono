import { PrismaClient } from '../../src';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;

// Create the adapter instance
const adapter = new PrismaPg({ connectionString });

// Pass it to the PrismaClient constructor using the 'adapter' property
const prisma = new PrismaClient({ adapter });

// 파티셔닝할 테이블 목록
const TABLES = [
  {
    name: 'auth_audit_logs',
    partitionKey: 'created_at',
  },
  {
    name: 'activity_logs',
    partitionKey: 'created_at',
  },
  {
    name: 'system_error_logs',
    partitionKey: 'created_at',
  },
  {
    name: 'integration_logs',
    partitionKey: 'created_at',
  },
] as const;

/**
 * 테이블이 이미 파티셔닝되어 있는지 확인
 */
async function isTablePartitioned(tableName: string): Promise<boolean> {
  // 테이블 이름은 화이트리스트에서만 오므로 안전하게 직접 삽입
  const result = await prisma.$queryRawUnsafe<Array<{ is_partitioned: boolean }>>(
    `
    SELECT EXISTS (
      SELECT 1
      FROM pg_inherits
      WHERE inhrelid = (
        SELECT oid
        FROM pg_class
        WHERE relname = '${tableName}'
        AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      )
    ) OR EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
      AND c.relname = '${tableName}'
      AND c.relkind = 'p'
    ) as is_partitioned;
    `,
  );

  return result[0]?.is_partitioned ?? false;
}

/**
 * 테이블이 존재하는지 확인
 */
async function tableExists(tableName: string): Promise<boolean> {
  // 테이블 이름은 화이트리스트에서만 오므로 안전하게 직접 삽입
  const result = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = '${tableName}'
    ) as exists;
    `,
  );

  return result[0]?.exists ?? false;
}

/**
 * 파티셔닝되지 않은 테이블을 파티션 테이블로 변환
 */
async function convertToPartitionedTable(
  tableName: string,
  partitionKey: string,
): Promise<void> {
  const tempTableName = `${tableName}_temp_${Date.now()}`;

  console.log(`  📋 ${tableName} 테이블을 파티션 테이블로 변환합니다...`);

  // 1. 기존 테이블 구조 확인 및 임시 테이블 생성
  await prisma.$executeRawUnsafe(`
    -- 기존 테이블을 임시 이름으로 변경
    ALTER TABLE "${tableName}" RENAME TO "${tempTableName}";
  `);

  // 2. 파티션 부모 테이블 생성 (기존 테이블과 동일한 구조)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "${tableName}" (
      LIKE "${tempTableName}" INCLUDING ALL
    ) PARTITION BY RANGE (${partitionKey});
  `);

  // 3. 기존 데이터를 파티션으로 마이그레이션
  // 먼저 데이터 범위 확인
  const dateRange = await prisma.$queryRawUnsafe<Array<{ min_date: Date; max_date: Date }>>(
    `
    SELECT 
      MIN(${partitionKey}) as min_date,
      MAX(${partitionKey}) as max_date
    FROM "${tempTableName}";
    `,
  );

  if (dateRange[0]?.min_date && dateRange[0]?.max_date) {
    const minDate = new Date(dateRange[0].min_date);
    const maxDate = new Date(dateRange[0].max_date);

    console.log(`  📅 데이터 범위: ${minDate.toISOString()} ~ ${maxDate.toISOString()}`);

    // 월별 파티션 생성 (데이터가 있는 기간 + 미래 3개월)
    const partitions = generateMonthlyPartitions(minDate, maxDate, 3);

    for (const partition of partitions) {
      await createPartition(tableName, partition.name, partition.start, partition.end);
    }

    // 기존 데이터를 파티션으로 이동
    console.log(`  🔄 기존 데이터를 파티션으로 이동합니다...`);
    await prisma.$executeRawUnsafe(`
      INSERT INTO "${tableName}"
      SELECT * FROM "${tempTableName}";
    `);
  } else {
    // 데이터가 없는 경우에도 기본 파티션 생성
    const partitions = generateMonthlyPartitions(new Date(), new Date(), 3);
    for (const partition of partitions) {
      await createPartition(tableName, partition.name, partition.start, partition.end);
    }
  }

  // 4. 임시 테이블 삭제
  await prisma.$executeRawUnsafe(`
    DROP TABLE "${tempTableName}";
  `);

  console.log(`  ✅ ${tableName} 테이블 파티셔닝 완료`);
}

/**
 * 월별 파티션 생성
 */
async function createPartition(
  tableName: string,
  partitionName: string,
  startDate: Date,
  endDate: Date,
): Promise<void> {
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${tableName}_${partitionName}"
    PARTITION OF "${tableName}"
    FOR VALUES FROM ('${startStr}') TO ('${endStr}');
  `);
}

/**
 * 월별 파티션 이름 및 날짜 범위 생성
 */
function generateMonthlyPartitions(
  startDate: Date,
  endDate: Date,
  futureMonths: number = 3,
): Array<{ name: string; start: Date; end: Date }> {
  const partitions: Array<{ name: string; start: Date; end: Date }> = [];

  // 시작일의 첫 날로 조정
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  // 종료일의 다음 달 첫 날로 조정
  const end = new Date(endDate.getFullYear(), endDate.getMonth() + 1 + futureMonths, 1);

  let current = new Date(start);

  while (current < end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const partitionName = `${year}_${month}`;

    const partitionStart = new Date(current);
    const partitionEnd = new Date(year, current.getMonth() + 1, 1);

    partitions.push({
      name: partitionName,
      start: partitionStart,
      end: partitionEnd,
    });

    current = partitionEnd;
  }

  return partitions;
}

/**
 * 미래 파티션 생성 (필요한 경우)
 */
async function ensureFuturePartitions(
  tableName: string,
  monthsAhead: number = 3,
): Promise<void> {
  const now = new Date();
  const futureDate = new Date(now.getFullYear(), now.getMonth() + monthsAhead, 1);

  const partitions = generateMonthlyPartitions(now, futureDate, 0);

  for (const partition of partitions) {
    await createPartition(tableName, partition.name, partition.start, partition.end);
  }
}

/**
 * 메인 함수
 */
async function main() {
  try {
    console.log('🔍 로그 테이블 파티셔닝을 시작합니다...\n');

    for (const table of TABLES) {
      console.log(`\n📊 ${table.name} 테이블 처리 중...`);

      // 테이블 존재 여부 확인
      const exists = await tableExists(table.name);
      if (!exists) {
        console.log(`  ⚠️  ${table.name} 테이블이 존재하지 않습니다. 건너뜁니다.`);
        continue;
      }

      // 이미 파티셔닝되어 있는지 확인
      const isPartitioned = await isTablePartitioned(table.name);
      if (isPartitioned) {
        console.log(`  ✅ ${table.name} 테이블이 이미 파티셔닝되어 있습니다.`);
        // 미래 파티션 확인
        await ensureFuturePartitions(table.name);
        continue;
      }

      // 파티셔닝 변환
      await convertToPartitionedTable(table.name, table.partitionKey);
    }

    console.log('\n✅ 모든 로그 테이블 파티셔닝이 완료되었습니다.');
  } catch (error) {
    console.error('❌ 파티셔닝 중 오류가 발생했습니다:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

