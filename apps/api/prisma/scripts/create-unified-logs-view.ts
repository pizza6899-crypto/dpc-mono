import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma';

const connectionString = `${process.env.DATABASE_URL}`;

// Create the adapter instance
const adapter = new PrismaPg({ connectionString });

// Pass it to the PrismaClient constructor using the 'adapter' property
const prisma = new PrismaClient({ adapter });

const CREATE_VIEW_SQL = `
CREATE VIEW "unified_logs" AS
SELECT 
  id, created_at, user_id, session_id, cf_ray, country, city, bot, threat, is_mobile, ip,
  'AUTH' as log_type, action as category, status as detail, metadata
FROM auth_audit_logs
UNION ALL
SELECT 
  id, created_at, user_id, session_id, cf_ray, country, city, NULL as bot, NULL as threat, is_mobile, NULL as ip,
  'ACTIVITY' as log_type, category, action as detail, metadata
FROM activity_logs
UNION ALL
SELECT 
  id, created_at, user_id, session_id, cf_ray, country, city, bot, threat, is_mobile, ip,
  'ERROR' as log_type, severity as category, error_message as detail, metadata
FROM system_error_logs
UNION ALL
SELECT 
  id, created_at, user_id, session_id, cf_ray, country, city, bot, threat, NULL as is_mobile, ip,
  'INTEGRATION' as log_type, provider as category, endpoint as detail, request_body as metadata
FROM integration_logs;
`;

async function main() {
  try {
    console.log('🔍 unified_logs 뷰 존재 여부를 확인합니다...');

    // 뷰 존재 여부 확인
    const viewExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'unified_logs'
      ) as exists;
    `;

    if (viewExists[0]?.exists) {
      console.log('✅ unified_logs 뷰가 이미 존재합니다. 건너뜁니다.');
      return;
    }

    console.log('📝 unified_logs 뷰를 생성합니다...');

    // 뷰 생성
    await prisma.$executeRawUnsafe(CREATE_VIEW_SQL);

    console.log('✅ unified_logs 뷰가 성공적으로 생성되었습니다.');
  } catch (error) {
    console.error('❌ unified_logs 뷰 생성 중 오류가 발생했습니다:', error);
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

