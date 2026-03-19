import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MarkSupportChatReadAdminRequestDto {
  @ApiProperty({
    description: 'Last read message ID / 마지막으로 읽은 메시지 ID',
    example: '12345678',
  })
  @IsNotEmpty()
  @IsString()
  lastReadMessageId: string;
}
