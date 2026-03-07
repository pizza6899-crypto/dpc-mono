import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiStandardResponse, ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { Public } from 'src/common/auth/decorators/roles.decorator';
import { GetChatConfigService } from '../../application/get-chat-config.service';
import { ChatConfigPublicResponseDto } from './dto/response/chat-config-public.response.dto';

@Controller('public/chat/config')
@ApiTags('Public Chat Config')
@ApiStandardErrors()
export class ChatConfigPublicController {
    constructor(private readonly getChatConfigService: GetChatConfigService) { }

    @Get()
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get global chat configuration / 글로벌 채팅 설정 조회',
        description: 'Retrieves global settings for the chat system. / 채팅 시스템의 전역 설정을 조회합니다.',
    })
    @ApiStandardResponse(ChatConfigPublicResponseDto)
    async getConfig(): Promise<ChatConfigPublicResponseDto> {
        const config = await this.getChatConfigService.execute();
        return {
            isGlobalChatEnabled: config.isGlobalChatEnabled,
            maxMessageLength: config.maxMessageLength,
            defaultSlowModeSeconds: config.defaultSlowModeSeconds,
            minChatTierLevel: config.minChatTierLevel,
            blockDuplicateMessages: config.blockDuplicateMessages,
        };
    }
}
