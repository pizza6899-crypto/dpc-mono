import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Notification Resource Parameters / 알림 리소스 조회용 파라미터
 */
export class NotificationParamDto {
  @ApiProperty({
    description: 'Encoded Notification ID / 난독화된 알림 ID',
  })
  @IsNotEmpty()
  @IsString()
  id: string;
}
