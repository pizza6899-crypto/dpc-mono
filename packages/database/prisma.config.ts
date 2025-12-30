import { defineConfig, env } from 'prisma/config';

export default defineConfig({
    schema: 'prisma/schema',
    migrations: {
        path: 'prisma/migrations',
        seed: 'tsx prisma/seed.ts',
    },
    datasource: {
        url: env('DATABASE_URL'), // 여기서 환경 변수를 로드합니다.
        // shadowDatabaseUrl: env('SHADOW_DATABASE_URL')
    },
});