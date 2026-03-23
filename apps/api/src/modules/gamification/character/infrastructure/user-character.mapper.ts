import { Injectable } from '@nestjs/common';
import { UserCharacter as PrismaUserCharacter, Prisma } from '@prisma/client';
import { UserCharacter } from '../domain/user-character.entity';
import { Cast, PersistenceOf } from 'src/infrastructure/persistence/persistence.util';

@Injectable()
export class UserCharacterMapper {
  /**
   * Prisma -> Domain
   */
  toDomain(p: PersistenceOf<PrismaUserCharacter>): UserCharacter {
    return UserCharacter.rehydrate({
      userId: Cast.bigint(p.userId),
      level: p.level,
      xp: Cast.decimal(p.xp),
      statPoints: p.statPoints,
      totalStatPoints: p.totalStatPoints,
      strength: p.strength,
      agility: p.agility,
      luck: p.luck,
      wisdom: p.wisdom,
      stamina: p.stamina,
      charisma: p.charisma,
      statResetCount: p.statResetCount,
      currentTitle: p.currentTitle,
      lastLeveledUpAt: Cast.date(p.lastLeveledUpAt),
      createdAt: Cast.date(p.createdAt),
      updatedAt: Cast.date(p.updatedAt),
    });
  }

  /**
   * Domain -> Prisma
   */
  toPersistence(domain: UserCharacter): Prisma.UserCharacterUncheckedUpdateInput & Prisma.UserCharacterUncheckedCreateInput {
    return {
      userId: domain.userId,
      level: domain.level,
      xp: domain.xp,
      statPoints: domain.statPoints,
      totalStatPoints: domain.totalStatPoints,
      strength: domain.strength,
      agility: domain.agility,
      luck: domain.luck,
      wisdom: domain.wisdom,
      stamina: domain.stamina,
      charisma: domain.charisma,
      statResetCount: domain.statResetCount,
      currentTitle: domain.currentTitle,
      lastLeveledUpAt: domain.lastLeveledUpAt,
    };
  }
}
