import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from '../../../../infrastructure/prisma/prisma.module';
import type {
  IScoreRepositoryPort,
  ScoreSearchOptions,
  UpsertScoreParams,
} from '../ports/score-repository.port';
import { UserIntelligenceScore } from '../domain/user-intelligence-score.entity';
import type { ScoreDetails } from '../domain/user-intelligence-score.entity';

@Injectable()
export class PrismaScoreRepository implements IScoreRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) { }

  private toEntity(raw: any): UserIntelligenceScore {
    return UserIntelligenceScore.rehydrate({
      userId: raw.userId,
      totalScore: raw.totalScore,
      valueScore: raw.valueScore,
      riskScore: raw.riskScore,
      scoreValueIndex: raw.scoreValueIndex,
      scoreDepositAmount: raw.scoreDepositAmount,
      scoreDepositCount: raw.scoreDepositCount,
      scoreRolling: raw.scoreRolling,
      scoreBehavior: raw.scoreBehavior,
      scoreRiskPromotion: raw.scoreRiskPromotion,
      scoreRiskTechnical: raw.scoreRiskTechnical,
      scoreRiskBehavior: raw.scoreRiskBehavior,
      details: (raw.details as ScoreDetails) ?? null,
      updatedAt: raw.updatedAt,
    });
  }

  async findByUserId(userId: bigint): Promise<UserIntelligenceScore | null> {
    const raw = await this.tx.userIntelligenceScore.findUnique({
      where: { userId },
    });
    return raw ? this.toEntity(raw) : null;
  }

  async upsert(params: UpsertScoreParams): Promise<UserIntelligenceScore> {
    const data = {
      userId: params.userId,
      totalScore: params.totalScore,
      valueScore: params.valueScore,
      riskScore: params.riskScore,
      scoreValueIndex: params.scoreValueIndex,
      scoreDepositAmount: params.scoreDepositAmount,
      scoreDepositCount: params.scoreDepositCount,
      scoreRolling: params.scoreRolling,
      scoreBehavior: params.scoreBehavior,
      scoreRiskPromotion: params.scoreRiskPromotion,
      scoreRiskTechnical: params.scoreRiskTechnical,
      scoreRiskBehavior: params.scoreRiskBehavior,
      details: (params.details ?? null) as any,
    };

    const raw = await this.tx.userIntelligenceScore.upsert({
      where: { userId: params.userId },
      create: data,
      update: data,
    });

    return this.toEntity(raw);
  }

  async findAndCountByScoreRange(
    options: ScoreSearchOptions,
  ): Promise<[UserIntelligenceScore[], number]> {
    const where = {
      totalScore: {
        gte: options.minTotal,
        lte: options.maxTotal,
      },
    };

    const [records, count] = await Promise.all([
      this.tx.userIntelligenceScore.findMany({
        where,
        orderBy: { totalScore: 'desc' },
        skip: options.skip ?? 0,
        take: options.take ?? 20,
      }),
      this.tx.userIntelligenceScore.count({ where }),
    ]);

    return [records.map((r) => this.toEntity(r)), count];
  }
}
