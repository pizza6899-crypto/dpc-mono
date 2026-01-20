import { CasinoGameSession } from '../domain';

export interface CasinoGameSessionRepositoryPort {
    create(session: CasinoGameSession): Promise<CasinoGameSession>;
    findByToken(token: string): Promise<CasinoGameSession | null>;
    findByUid(uid: string): Promise<CasinoGameSession | null>;
    findByid(id: bigint): Promise<CasinoGameSession | null>;
}
