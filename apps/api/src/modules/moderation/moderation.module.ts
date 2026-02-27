import { Module, Global } from '@nestjs/common';
import { ModerationService } from './application/moderation.service';

@Global()
@Module({
    providers: [ModerationService],
    exports: [ModerationService],
})
export class ModerationModule { }
