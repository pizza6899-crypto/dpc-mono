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
      casinoBenefit: p.baseCasinoBenefit,
      slotBenefit: p.baseSlotBenefit,
      sportsBenefit: p.baseSportsBenefit,
      minigameBenefit: p.baseMinigameBenefit,
      badBeatJackpot: p.baseBadBeatJackpot,
      criticalJackpot: p.baseCriticalJackpot,
      totalCasinoBenefit: p.totalCasinoBenefit,
      totalSlotBenefit: p.totalSlotBenefit,
      totalSportsBenefit: p.totalSportsBenefit,
      totalMinigameBenefit: p.totalMinigameBenefit,
      totalBadBeatJackpot: p.totalBadBeatJackpot,
      totalCriticalJackpot: p.totalCriticalJackpot,
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
      baseCasinoBenefit: domain.casinoBenefit,
      baseSlotBenefit: domain.slotBenefit,
      baseSportsBenefit: domain.sportsBenefit,
      baseMinigameBenefit: domain.minigameBenefit,
      baseBadBeatJackpot: domain.badBeatJackpot,
      baseCriticalJackpot: domain.criticalJackpot,
      totalCasinoBenefit: domain.totalCasinoBenefit,
      totalSlotBenefit: domain.totalSlotBenefit,
      totalSportsBenefit: domain.totalSportsBenefit,
      totalMinigameBenefit: domain.totalMinigameBenefit,
      totalBadBeatJackpot: domain.totalBadBeatJackpot,
      totalCriticalJackpot: domain.totalCriticalJackpot,
      statResetCount: domain.statResetCount,
      currentTitle: domain.currentTitle,
      lastLeveledUpAt: domain.lastLeveledUpAt,
    };
  }
}
