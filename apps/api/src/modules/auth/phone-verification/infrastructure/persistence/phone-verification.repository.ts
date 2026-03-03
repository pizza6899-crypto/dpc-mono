import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { TokenType } from '@prisma/client';
import { PhoneVerificationRepositoryPort, VerificationTokenData } from '../../ports/out/phone-verification.repository.port';

@Injectable()
export class PhoneVerificationRepository implements PhoneVerificationRepositoryPort {
    constructor(private readonly prisma: PrismaService) { }

    async save(data: VerificationTokenData): Promise<void> {
        await this.prisma.verificationToken.create({
            data: {
                userId: data.userId,
                type: data.type,
                token: data.token,
                expiresAt: data.expiresAt,
                metadata: data.metadata || {},
            },
        });
    }

    async findLatest(userId: bigint, type: TokenType): Promise<VerificationTokenData | null> {
        const token = await this.prisma.verificationToken.findFirst({
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
            userId: token.userId,
            type: token.type,
            token: token.token,
            expiresAt: token.expiresAt,
            createdAt: token.createdAt,
            metadata: token.metadata,
        };
    }

    async findByToken(token: string, type: TokenType): Promise<VerificationTokenData | null> {
        const record = await this.prisma.verificationToken.findUnique({
            where: {
                token,
                type,
            },
        });

        if (!record || record.usedAt) return null;

        return {
            userId: record.userId,
            type: record.type,
            token: record.token,
            expiresAt: record.expiresAt,
            createdAt: record.createdAt,
            metadata: record.metadata,
        };
    }

    async markAsUsed(token: string): Promise<void> {
        await this.prisma.verificationToken.update({
            where: { token },
            data: { usedAt: new Date() },
        });
    }
}
