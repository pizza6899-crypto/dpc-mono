import { ApiProperty } from '@nestjs/swagger';

export class SupportInquiryUserResponseDto {
  @ApiProperty({
    description: 'Room ID (Encoded) / 채팅방 ID',
    example: 'ROOM_ABC123',
  })
  id: string;
}
