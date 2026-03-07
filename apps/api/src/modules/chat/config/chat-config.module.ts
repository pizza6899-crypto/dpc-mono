import { Module } from '@nestjs/common';
import { CHAT_CONFIG_REPOSITORY_PORT } from './ports/chat-config.repository.port';
import { ChatConfigRepository } from './infrastructure/chat-config.repository';
import { GetChatConfigService } from './application/get-chat-config.service';
import { UpdateChatConfigService } from './application/update-chat-config.service';
import { ChatConfigAdminController } from './controllers/admin/chat-config-admin.controller';
import { ChatConfigPublicController } from './controllers/public/chat-config-public.controller';

@Module({
    imports: [],
    controllers: [
        ChatConfigAdminController,
        ChatConfigPublicController,
    ],
    providers: [
        {
            provide: CHAT_CONFIG_REPOSITORY_PORT,
            useClass: ChatConfigRepository,
        },
        GetChatConfigService,
        UpdateChatConfigService,
    ],
    exports: [GetChatConfigService],
})
export class ChatConfigModule { }
