import { TokenType } from '@prisma/client';

export interface VerificationTokenData {
    userId: bigint;
    type: TokenType;
    token: string;
    expiresAt: Date;
    createdAt?: Date;
    metadata?: any;
}

export interface PhoneVerificationRepositoryPort {
    save(data: VerificationTokenData): Promise<void>;
    findLatest(userId: bigint, type: TokenType): Promise<VerificationTokenData | null>;
    findByToken(token: string, type: TokenType): Promise<VerificationTokenData | null>;
    markAsUsed(token: string): Promise<void>;
}
