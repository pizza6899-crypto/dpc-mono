import { Global, Module } from '@nestjs/common';
import { SqidsService } from './sqids.service';
import { EnvModule } from '../env/env.module';

@Global()
@Module({
    imports: [EnvModule],
    providers: [SqidsService],
    exports: [SqidsService],
})
export class SqidsModule { }
