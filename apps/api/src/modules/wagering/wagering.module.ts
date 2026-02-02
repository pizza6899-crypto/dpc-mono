import { Module } from '@nestjs/common';
import { RequirementModule } from './requirement/requirement.module';
import { ConfigModule } from './config/config.module';

@Module({
    imports: [RequirementModule, ConfigModule],
    exports: [RequirementModule, ConfigModule],
})
export class WageringModule { }
