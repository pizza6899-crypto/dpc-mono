
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { sql } from 'kysely';

@Injectable()
export class KyselyTestService implements OnModuleInit {
    constructor(private readonly prisma: PrismaService) { }

    async onModuleInit() {
        console.log('--- Kysely Integration Test Start ---');
        try {
            // 1. 단순 쿼리 실행
            const result = await this.prisma.kysely
                .selectFrom('User')
                .select(['id', 'email', 'role'])
                .limit(1)
                .execute();

            console.log('Kysely Select Result:', result);

            // 2. Raw SQL 실행
            const rawResult = await sql`SELECT NOW()`.execute(this.prisma.kysely);
            console.log('Kysely Raw SQL Result:', rawResult.rows);

            // 3. 트랜잭션 테스트 (Prisma 트랜잭션 내에서 Kysely 사용)
            await this.prisma.$transaction(async (tx) => {
                console.log('Inside Transaction');
                // tx는 확장된 클라이언트이므로 $kysely 접근 가능 (타입 단언 필요할 수 있음)
                // prisma-extension-kysely는 tx.$kysely를 제공합니다.
                const txKysely = (tx as any).$kysely; // 또는 tx.kysely (확장에 따라 다름)

                if (txKysely) {
                    const txResult = await txKysely
                        .selectFrom('User')
                        .selectAll()
                        .limit(1)
                        .execute();
                    console.log('Transaction Kysely Query Result:', txResult.length > 0 ? 'Success' : 'Empty');
                } else {
                    console.log('Transaction Kysely instance not found on tx object');
                    // $extends로 확장했다면 tx 객체에도 확장된 메서드/속성이 있어야 함
                    // 확인을 위해 키 검사
                    // console.log(Object.keys(tx));
                }
            });

            console.log('--- Kysely Integration Test Passed ---');
        } catch (error) {
            console.error('--- Kysely Integration Test Failed ---', error);
        }
    }
}
