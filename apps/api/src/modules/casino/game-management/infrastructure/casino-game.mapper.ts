import { Injectable } from '@nestjs/common';
import { CasinoGame } from '../domain/model/casino-game.entity';

@Injectable()
export class CasinoGameMapper {
    toDomain(prismaModel: any): CasinoGame {
        return CasinoGame.create({
            id: prismaModel.id,
            aggregatorType: prismaModel.aggregatorType,
            provider: prismaModel.provider,
            category: prismaModel.category,
            isEnabled: prismaModel.isEnabled,
            isVisibleToUser: prismaModel.isVisibleToUser,
            iconLink: prismaModel.iconLink,
            createdAt: prismaModel.createdAt,
            updatedAt: prismaModel.updatedAt,
            translations: prismaModel.translations?.map((t: any) => ({
                language: t.language,
                gameName: t.gameName,
                categoryName: t.categoryName,
            })),
        });
    }

    // toPrisma는 필요할 때 추가
}
