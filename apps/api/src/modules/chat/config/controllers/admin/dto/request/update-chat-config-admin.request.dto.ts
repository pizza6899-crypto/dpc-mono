import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, Min } from 'class-validator';

export class UpdateChatConfigAdminRequestDto {
    @ApiProperty({
        description: 'Enable global chat / 글로벌 채팅 활성화 여부',
        example: true,
    })
    @IsBoolean()
    isGlobalChatEnabled: boolean;

    @ApiProperty({
        description: 'Maximum message length / 채팅 메시지 최대 길이',
        example: 500,
    })
    @IsInt()
    @Min(1)
    maxMessageLength: number;

    @ApiProperty({
        description: 'Default slow mode seconds / 도배 방지 쿨다운 (초)',
        example: 3,
    })
    @IsInt()
    @Min(0)
    defaultSlowModeSeconds: number;

    @ApiProperty({
        description: 'Minimum tier level for chat / 채팅 참여를 위한 최소 티어 레벨',
        example: 0,
    })
    @IsInt()
    @Min(0)
    minChatTierLevel: number;

    @ApiProperty({
        description: 'Block duplicate messages / 중복 메시지 차단 여부',
        example: true,
    })
    @IsBoolean()
    blockDuplicateMessages: boolean;
}
