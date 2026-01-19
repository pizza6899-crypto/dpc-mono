import { Injectable } from '@nestjs/common';
import { CasinoGameV2 as PrismaGame, CasinoGameV2Translation as PrismaTranslation } from '@repo/database';
import { CasinoGameV2, GameTranslation } from '../domain';

type PrismaGameWithTranslations = PrismaGame & {
    translations: PrismaTranslation[];
};

@Injectable()
export class GameMapper {
    toDomain(prismaGame: PrismaGameWithTranslations): CasinoGameV2 {
        return CasinoGameV2.create({
            id: prismaGame.id,
            providerId: prismaGame.providerId,
            externalGameId: prismaGame.externalGameId,
            code: prismaGame.code,
            thumbnailUrl: prismaGame.thumbnailUrl,
            bannerUrl: prismaGame.bannerUrl,
            rtp: prismaGame.rtp,
            volatility: prismaGame.volatility,
            gameType: prismaGame.gameType,
            tableId: prismaGame.tableId,
            tags: prismaGame.tags,
            houseEdge: prismaGame.houseEdge,
            contributionRate: prismaGame.contributionRate,
            sortOrder: prismaGame.sortOrder,
            isEnabled: prismaGame.isEnabled,
            isVisible: prismaGame.isVisible,
            translations: prismaGame.translations.map((t) => ({
                language: t.language,
                name: t.name,
            })),
        });
    }

    toPrisma(domain: CasinoGameV2): any {
        return {
            providerId: domain.providerId,
            externalGameId: domain.externalGameId,
            code: domain.code,
            thumbnailUrl: domain.thumbnailUrl,
            bannerUrl: domain.bannerUrl,
            rtp: domain.rtp,
            volatility: domain.volatility,
            gameType: domain.gameType,
            tableId: domain.tableId,
            tags: domain.tags,
            houseEdge: domain.houseEdge,
            contributionRate: domain.contributionRate,
            sortOrder: domain.sortOrder,
            isEnabled: domain.isEnabled,
            isVisible: domain.isVisible,
        };
    }

    toPrismaTranslations(domain: CasinoGameV2): any[] {
        return domain.translations.map((t) => ({
            language: t.language,
            name: t.name,
        }));
    }
}
