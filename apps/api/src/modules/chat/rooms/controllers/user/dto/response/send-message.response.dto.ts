import { ApiProperty } from '@nestjs/swagger';

export class SendMessageResponseDto {
    @ApiProperty({ description: 'Message ID (Encoded) / 메시지 ID', example: 'cm_123' })
    id: string;
}
