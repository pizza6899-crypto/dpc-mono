import { Injectable } from '@nestjs/common';
import { UserCharacterLog as PrismaUserCharacterLog, Prisma } from '@prisma/client';
import { UserCharacterLog } from '../domain/user-character-log.entity';
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
      details: p.details,
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
      details: domain.details as any,
      createdAt: domain.createdAt,
    };
  }
}
