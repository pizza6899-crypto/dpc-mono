import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MarkSupportChatReadUserRequestDto {
  @ApiProperty({
    description:
      'Last read message ID (Encoded) / 마지막으로 읽은 메시지 ID (인코딩됨)',
    example: 'M123456',
  })
  @IsNotEmpty()
  @IsString()
  lastReadMessageId: string;
}
