import { Module } from '@nestjs/common';
import { GamificationCatalogModule } from './catalog/catalog.module';
import { GamificationCharacterModule } from './character/character.module';

@Module({
  imports: [
    GamificationCatalogModule,
    GamificationCharacterModule,
  ],
})
export class GamificationModule { }
