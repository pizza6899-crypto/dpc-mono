import { Module, Global } from '@nestjs/common';
import { ModerationService } from './application/moderation.service';
import { PrismaForbiddenWordRepository } from './infrastructure/prisma-forbidden-word.repository';
import { FORBIDDEN_WORD_REPOSITORY } from './ports/out/moderation-repository.port';

@Global()
@Module({
    providers: [
        ModerationService,
        {
            provide: FORBIDDEN_WORD_REPOSITORY,
            useClass: PrismaForbiddenWordRepository,
        },
    ],
    exports: [ModerationService],
})
export class ModerationModule { }
