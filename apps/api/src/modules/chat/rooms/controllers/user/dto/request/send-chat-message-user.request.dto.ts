import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { ChatMessageType } from '@prisma/client';

export class SendChatMessageUserRequestDto {
    @ApiProperty({ description: 'Message Content / 메시지 내용', example: 'Hello, world!' })
    @IsNotEmpty()
    @IsString()
    content: string;

    @ApiPropertyOptional({ description: 'Message Type / 메시지 타입', enum: ChatMessageType, example: ChatMessageType.TEXT })
    @IsOptional()
    @IsEnum(ChatMessageType)
    type?: ChatMessageType;
}
