import { Module } from '@nestjs/common';
import { CharacterMasterModule } from './master/master.module';
import { CharacterStatusModule } from './status/status.module';

@Module({
  imports: [
    CharacterMasterModule,
    CharacterStatusModule,
  ],
})
export class CharacterModule { }
