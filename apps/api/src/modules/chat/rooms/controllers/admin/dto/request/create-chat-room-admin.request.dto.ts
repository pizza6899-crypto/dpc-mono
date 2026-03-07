import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChatRoomType } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsJSON, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateChatRoomAdminRequestDto {
    @ApiPropertyOptional({ description: 'Slug for the room / 방 식별자 슬러그', example: 'global:en' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    slug?: string;

    @ApiProperty({ description: 'Room Type / 방 타입', enum: ChatRoomType, example: ChatRoomType.PUBLIC })
    @IsEnum(ChatRoomType)
    type: ChatRoomType;

    @ApiPropertyOptional({ description: 'Is room active / 방 활성화 여부', default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean = true;

    @ApiPropertyOptional({ description: 'Metadata (JSON) / 메타데이터', example: { language: 'en' } })
    @IsOptional()
    metadata?: any;

    @ApiPropertyOptional({ description: 'Slow mode seconds / 도배 방지 쿨다운 (초)', default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    slowModeSeconds?: number = 0;

    @ApiPropertyOptional({ description: 'Minimum tier level to join / 참여를 위한 최소 티어 레벨', default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    minTierLevel?: number = 0;
}
