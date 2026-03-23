import { Module } from '@nestjs/common';
import { GamificationCatalogModule } from './catalog/catalog.module';

@Module({
  imports: [
    GamificationCatalogModule,
    // Future: CharacterModule, InventoryModule,
  ],
})
export class GamificationModule { }
