import { Injectable, Inject } from '@nestjs/common';
import { CHAT_MESSAGE_REPOSITORY_PORT, type ChatMessageRepositoryPort } from '../ports/chat-message.repository.port';
import { ChatMessage } from '../domain/chat-message.entity';
import { FileUrlService } from 'src/modules/file/application/file-url.service';

export interface GetChatMessagesParams {
    roomId: bigint;
    limit?: number;
    lastMessageId?: bigint;
}

@Injectable()
export class GetChatMessagesService {
    constructor(
        @Inject(CHAT_MESSAGE_REPOSITORY_PORT)
        private readonly messageRepository: ChatMessageRepositoryPort,
        private readonly fileUrlService: FileUrlService,
    ) { }

    async execute(params: GetChatMessagesParams): Promise<ChatMessage[]> {
        const messages = await this.messageRepository.findByRoomId(
            params.roomId,
            params.limit ?? 30,
            params.lastMessageId,
        );

        // 첨부파일 URL 복원 작업
        await this.populateFileUrls(messages);

        return messages;
    }

    /**
     * 메시지 목록에 포함된 첨부 파일들의 접근 URL을 채워줍니다.
     */
    private async populateFileUrls(messages: ChatMessage[]): Promise<void> {
        const fileIds = messages
            .flatMap(m => m.metadata?.attachments || [])
            .map(a => BigInt(a.fileId));

        if (fileIds.length === 0) return;

        // 파일 모듈의 서비스를 통해 URL 맵 획득
        const urlMap = await this.fileUrlService.getUrlsByFileIds(fileIds);

        // 메시지 객체에 URL 주입
        messages.forEach(message => {
            message.metadata?.attachments?.forEach(attachment => {
                attachment.url = urlMap.get(attachment.fileId);
            });
        });
    }
}
