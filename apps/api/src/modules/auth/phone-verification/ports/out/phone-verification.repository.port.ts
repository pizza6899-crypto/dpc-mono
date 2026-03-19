import { TokenType } from '@prisma/client';

export interface VerificationTokenMetadata {
  phoneNumber?: string;
  email?: string;
}

export interface VerificationTokenData {
  id?: bigint;
  userId: bigint;
  type: TokenType;
  token: string;
  expiresAt: Date;
  createdAt?: Date;
  metadata?: VerificationTokenMetadata;
}

export interface PhoneVerificationRepositoryPort {
  save(data: VerificationTokenData): Promise<void>;
  findLatest(
    userId: bigint,
    type: TokenType,
  ): Promise<VerificationTokenData | null>;
  findByToken(
    token: string,
    type: TokenType,
    userId: bigint,
  ): Promise<VerificationTokenData | null>;
  markAsUsed(token: string, userId: bigint): Promise<void>;
}
