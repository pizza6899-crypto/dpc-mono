import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageHistoryRequestDto {
  @ApiPropertyOptional({
    description: 'Limit / 한 번에 가져올 메시지 수',
    default: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({
    description:
      'Last Message ID (Encoded) / 이전 페이지의 마지막 메시지 ID (커서)',
  })
  @IsOptional()
  @IsString()
  lastMessageId?: string;
}
