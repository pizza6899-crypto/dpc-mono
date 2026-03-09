import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class SendChatMessageUserRequestDto {
    @ApiProperty({ description: 'Message Content / 메시지 내용', example: 'Hello, world!' })
    @IsNotEmpty()
    @IsString()
    content: string;

    @ApiPropertyOptional({
        description: 'Image IDs / 이미지 파일 ID 목록',
        type: [String],
        example: ['f_sqid_id'],
    })
    @IsOptional()
    @IsString({ each: true })
    imageIds?: string[];
}
