// src/modules/auth/credential/infrastructure/password-reset-token.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import type {
  PasswordResetTokenRepositoryPort,
  PasswordResetTokenData,
} from '../ports/out/password-reset-token.repository.port';
import { TokenType } from 'src/generated/prisma';

@Injectable()
export class PasswordResetTokenRepository
  implements PasswordResetTokenRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) { }

  async create(params: {
    userId: bigint;
    token: string;
    expiresAt: Date;
  }): Promise<PasswordResetTokenData> {
    const result = await this.tx.userToken.create({
      data: {
        userId: params.userId,
        type: TokenType.PASSWORD_RESET,
        token: params.token,
        expiresAt: params.expiresAt,
      },
    });

    return {
      id: result.id,
      userId: result.userId,
      token: result.token,
      expiresAt: result.expiresAt,
      usedAt: result.usedAt,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  async findByToken(token: string): Promise<PasswordResetTokenData | null> {
    const result = await this.tx.userToken.findFirst({
      where: {
        token,
        type: TokenType.PASSWORD_RESET,
        usedAt: null, // 사용되지 않은 토큰만
        expiresAt: {
          gt: new Date(), // 만료되지 않은 토큰만
        },
      },
    });

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      userId: result.userId,
      token: result.token,
      expiresAt: result.expiresAt,
      usedAt: result.usedAt,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  async markAsUsed(tokenId: number): Promise<void> {
    await this.tx.userToken.update({
      where: { id: tokenId },
      data: { usedAt: new Date() },
    });
  }

  async deleteUnusedByUserId(userId: bigint): Promise<void> {
    await this.tx.userToken.deleteMany({
      where: {
        userId,
        type: TokenType.PASSWORD_RESET,
        usedAt: null,
      },
    });
  }
}

