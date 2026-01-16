import kyselyExtension from 'prisma-extension-kysely';
import {
    Kysely,
    PostgresAdapter,
    PostgresIntrospector,
    PostgresQueryCompiler,
} from 'kysely';
import { DB } from './db/types';

export * from './db/types';
export * from './db/enums';

// Re-export Kysely classes if needed by consumers
export { Kysely } from 'kysely';

export const extension = () =>
    kyselyExtension({
        kysely: (driver: any) =>
            new Kysely<DB>({
                dialect: {
                    createAdapter: () => new PostgresAdapter(),
                    createDriver: () => driver,
                    createIntrospector: (db) => new PostgresIntrospector(db),
                    createQueryCompiler: () => new PostgresQueryCompiler(),
                },
            }),
    });
