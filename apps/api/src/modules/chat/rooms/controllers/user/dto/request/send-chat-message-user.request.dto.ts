import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsIn } from 'class-validator';
import { ChatMessageType } from '@prisma/client';

const ALLOWED_USER_CHAT_MESSAGE_TYPES = [
    ChatMessageType.TEXT,
    ChatMessageType.IMAGE,
    ChatMessageType.EMOJI,
];

export class SendChatMessageUserRequestDto {
    @ApiProperty({ description: 'Message Content / 메시지 내용', example: 'Hello, world!' })
    @IsNotEmpty()
    @IsString()
    content: string;

    @ApiPropertyOptional({
        description: 'Message Type / 메시지 타입 (Allowed: TEXT, IMAGE, EMOJI / 허용: TEXT, IMAGE, EMOJI)',
        enum: ALLOWED_USER_CHAT_MESSAGE_TYPES,
        example: ChatMessageType.TEXT,
    })
    @IsOptional()
    @IsEnum(ChatMessageType)
    @IsIn(ALLOWED_USER_CHAT_MESSAGE_TYPES)
    type?: ChatMessageType = ChatMessageType.TEXT;

    @ApiPropertyOptional({
        description: 'File ID / 파일 ID (Required if type is IMAGE / IMAGE 타입인 경우 필수)',
        example: 'f_sqid_id',
    })
    @IsOptional()
    @IsString()
    fileId?: string;
}
