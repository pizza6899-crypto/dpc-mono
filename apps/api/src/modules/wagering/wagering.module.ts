import { Module } from '@nestjs/common';
import { RequirementModule } from './requirement/requirement.module';
import { WageringConfigModule } from './config/wagering-config.module';

@Module({
  imports: [RequirementModule, WageringConfigModule],
  exports: [RequirementModule, WageringConfigModule],
})
export class WageringModule {}
