import type { Prisma } from '@prisma/client';

export class WageringContributionLog {
  constructor(
    public readonly id: bigint,
    public readonly wageringRequirementId: bigint,
    public readonly gameRoundId: bigint,
    public readonly requestAmount: Prisma.Decimal,
    public readonly contributionRate: Prisma.Decimal,
    public readonly wageredAmount: Prisma.Decimal,
    public readonly createdAt: Date,
  ) {}

  static fromPersistence(data: {
    id: bigint;
    wageringRequirementId: bigint;
    gameRoundId: bigint;
    requestAmount: Prisma.Decimal;
    contributionRate: Prisma.Decimal;
    wageredAmount: Prisma.Decimal;
    createdAt: Date;
  }): WageringContributionLog {
    return new WageringContributionLog(
      data.id,
      data.wageringRequirementId,
      data.gameRoundId,
      data.requestAmount,
      data.contributionRate,
      data.wageredAmount,
      data.createdAt,
    );
  }
}
