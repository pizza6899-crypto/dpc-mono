import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from '../../../../infrastructure/prisma/prisma.module';
import type { IPolicyRepositoryPort } from '../ports/policy-repository.port';
import { UserIntelligencePolicy } from '../domain/user-intelligence-policy.entity';

@Injectable()
export class PrismaPolicyRepository implements IPolicyRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) { }

  async findActivePolicy(): Promise<UserIntelligencePolicy | null> {
    const record = await this.tx.userIntelligencePolicy.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) return null;

    return UserIntelligencePolicy.rehydrate({
      id: record.id,
      config: record.config,
      adminNote: record.adminNote,
      isActive: record.isActive,
      createdAt: record.createdAt,
    });
  }

  async savePolicy(policy: UserIntelligencePolicy): Promise<{ id: number }> {
    // 기존 active 정책 모두 비활성화
    await this.tx.userIntelligencePolicy.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    const created = await this.tx.userIntelligencePolicy.create({
      data: {
        config: policy.config as any,
        adminNote: policy.adminNote,
        isActive: true,
      },
      select: { id: true },
    });

    return { id: created.id };
  }

  async deactivatePolicy(id: number): Promise<void> {
    await this.tx.userIntelligencePolicy.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
