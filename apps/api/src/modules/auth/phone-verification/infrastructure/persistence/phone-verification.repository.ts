import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { TokenType } from '@prisma/client';
import {
  PhoneVerificationRepositoryPort,
  VerificationTokenData,
} from '../../ports/out/phone-verification.repository.port';

@Injectable()
export class PhoneVerificationRepository implements PhoneVerificationRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) {}

  async save(data: VerificationTokenData): Promise<void> {
    await this.tx.verificationToken.create({
      data: {
        userId: data.userId,
        type: data.type,
        token: data.token,
        expiresAt: data.expiresAt,
        metadata: data.metadata || {},
      },
    });
  }

  async findLatest(
    userId: bigint,
    type: TokenType,
  ): Promise<VerificationTokenData | null> {
    const token = await this.tx.verificationToken.findFirst({
      where: {
        userId,
        type,
        usedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!token) return null;

    return {
      id: BigInt(token.id),
      userId: token.userId,
      type: token.type,
      token: token.token,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
      metadata: token.metadata as any,
    };
  }

  async findByToken(
    token: string,
    type: TokenType,
    userId: bigint,
  ): Promise<VerificationTokenData | null> {
    const record = await this.tx.verificationToken.findFirst({
      where: {
        token,
        type,
        userId,
        usedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!record) return null;

    return {
      id: BigInt(record.id),
      userId: record.userId,
      type: record.type,
      token: record.token,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      metadata: record.metadata as any,
    };
  }

  async markAsUsed(token: string, userId: bigint): Promise<void> {
    // 특정 유저의 가장 최근 미사용 토큰 하나만 사용 처리
    const latest = await this.tx.verificationToken.findFirst({
      where: { token, userId, usedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (latest) {
      await this.tx.verificationToken.update({
        where: { id: latest.id },
        data: { usedAt: new Date() },
      });
    }
  }
}
