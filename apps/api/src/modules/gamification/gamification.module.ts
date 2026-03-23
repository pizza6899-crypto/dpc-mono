import { Module } from '@nestjs/common';
import { GamificationCatalogModule } from './catalog/catalog.module';
import { GamificationCharacterModule } from './character/character.module';
import { GamificationInventoryModule } from './inventory/inventory.module';

@Module({
  imports: [
    GamificationCatalogModule,
    GamificationCharacterModule,
    GamificationInventoryModule,
  ],
})
export class GamificationModule { }
