import { Injectable } from '@nestjs/common';
import { UserCharacterLog as PrismaUserCharacterLog, Prisma } from '@prisma/client';
import { UserCharacterLog, UserCharacterLogDetails } from '../domain/user-character-log.entity';
import { Cast, PersistenceOf } from 'src/infrastructure/persistence/persistence.util';

@Injectable()
export class UserCharacterLogMapper {
  /**
   * Prisma -> Domain
   */
  toDomain(p: PersistenceOf<PrismaUserCharacterLog>): UserCharacterLog {
    return UserCharacterLog.rehydrate({
      id: Cast.bigint(p.id),
      userId: Cast.bigint(p.userId),
      type: p.type,
      beforeLevel: p.beforeLevel,
      afterLevel: p.afterLevel,
      beforeStatPoints: p.beforeStatPoints,
      afterStatPoints: p.afterStatPoints,
      amount: p.amount ? new Prisma.Decimal(p.amount as any) : null,
      referenceId: p.referenceId ? Cast.bigint(p.referenceId) : null,
      details: p.details as UserCharacterLogDetails,
      createdAt: Cast.date(p.createdAt),
    });
  }

  /**
   * Domain -> Prisma
   */
  toPersistence(domain: UserCharacterLog): Prisma.UserCharacterLogUncheckedCreateInput {
    return {
      userId: domain.userId,
      type: domain.type,
      beforeLevel: domain.beforeLevel,
      afterLevel: domain.afterLevel,
      beforeStatPoints: domain.beforeStatPoints,
      afterStatPoints: domain.afterStatPoints,
      amount: domain.amount,
      referenceId: domain.referenceId,
      details: domain.details as any,
      createdAt: domain.createdAt,
    };
  }
}
