import { ApiProperty } from '@nestjs/swagger';

export class SendSupportMessageAdminResponseDto {
    @ApiProperty({ description: 'Message ID / 메시지 ID', example: '23984723984723' })
    id: string;
}
