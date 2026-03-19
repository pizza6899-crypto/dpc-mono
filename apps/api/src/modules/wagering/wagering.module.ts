import { Module } from '@nestjs/common';
import { RequirementModule } from './requirement/requirement.module';
import { WageringConfigModule } from './config/wagering-config.module';
import { WageringEngineModule } from './engine/wagering-engine.module';

@Module({
  imports: [RequirementModule, WageringConfigModule, WageringEngineModule],
  exports: [RequirementModule, WageringConfigModule, WageringEngineModule],
})
export class WageringModule { }
