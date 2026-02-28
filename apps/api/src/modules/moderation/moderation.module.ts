import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ModerationService } from './application/moderation.service';
import { PrismaForbiddenWordRepository } from './infrastructure/prisma-forbidden-word.repository';
import { AiModerationAdapter } from './infrastructure/ai-moderation.adapter';
import { FORBIDDEN_WORD_REPOSITORY } from './ports/out/moderation-repository.port';
import { AI_MODERATION_PORT } from './ports/out/ai-moderation.port';
import { EnvModule } from 'src/common/env/env.module';

// Admin Services
import { FindForbiddenWordsAdminService } from './application/admin/find-forbidden-words-admin.service';
import { CreateForbiddenWordAdminService } from './application/admin/create-forbidden-word-admin.service';
import { UpdateForbiddenWordAdminService } from './application/admin/update-forbidden-word-admin.service';
import { DeleteForbiddenWordAdminService } from './application/admin/delete-forbidden-word-admin.service';

// Controllers
import { ForbiddenWordAdminController } from './controllers/admin/forbidden-word-admin.controller';

@Global()
@Module({
    imports: [HttpModule, EnvModule],
    controllers: [ForbiddenWordAdminController],
    providers: [
        ModerationService,
        FindForbiddenWordsAdminService,
        CreateForbiddenWordAdminService,
        UpdateForbiddenWordAdminService,
        DeleteForbiddenWordAdminService,
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
