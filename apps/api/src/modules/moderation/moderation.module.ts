import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ModerationService } from './application/moderation.service';
import { PrismaForbiddenWordRepository } from './infrastructure/prisma-forbidden-word.repository';
import { AiModerationAdapter } from './infrastructure/ai-moderation.adapter';
import { FORBIDDEN_WORD_REPOSITORY } from './ports/out/moderation-repository.port';
import { AI_MODERATION_PORT } from './ports/out/ai-moderation.port';
import { EnvModule } from 'src/common/env/env.module';

@Global()
@Module({
    imports: [HttpModule, EnvModule],
    providers: [
        ModerationService,
        {
            provide: FORBIDDEN_WORD_REPOSITORY,
            useClass: PrismaForbiddenWordRepository,
        },
        {
            provide: AI_MODERATION_PORT,
            useClass: AiModerationAdapter,
        },
    ],
    exports: [ModerationService],
})
export class ModerationModule { }
