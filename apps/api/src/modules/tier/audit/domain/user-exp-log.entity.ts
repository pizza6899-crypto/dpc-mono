import type {
  ExpSourceType,
  UserExpLog as PrismaUserExpLog,
} from '@prisma/client';
import { Cast } from 'src/infrastructure/persistence/persistence.util';

export class UserExpLog {
  constructor(
    public readonly id: bigint,
    public readonly userId: bigint,
    public readonly amount: bigint,
    public readonly statusExpSnap: bigint,
    public readonly sourceType: ExpSourceType,
    public readonly referenceId: bigint | null,
    public readonly reason: string | null,
    public readonly createdAt: Date,
  ) {}

  static fromPersistence(data: PrismaUserExpLog): UserExpLog {
    return new UserExpLog(
      Cast.bigint(data.id),
      Cast.bigint(data.userId),
      Cast.bigint(data.amount),
      Cast.bigint(data.statusExpSnap),
      data.sourceType,
      Cast.bigint(data.referenceId),
      data.reason,
      Cast.date(data.createdAt),
    );
  }
}
