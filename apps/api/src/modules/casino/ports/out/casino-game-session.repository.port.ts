import { CasinoGameSession } from '../../domain/model/casino-game-session.entity';

export interface CasinoGameSessionRepositoryPort {
    create(session: CasinoGameSession): Promise<CasinoGameSession>;
    findByToken(token: string): Promise<CasinoGameSession | null>;
    findByUid(uid: string): Promise<CasinoGameSession | null>;
    findByid(id: bigint): Promise<CasinoGameSession | null>;
}
