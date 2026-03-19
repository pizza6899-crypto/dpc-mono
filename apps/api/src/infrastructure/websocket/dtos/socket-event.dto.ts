import { ApiProperty } from '@nestjs/swagger';

export class SocketEventDto<T = any> {
  @ApiProperty({
    description: '알림의 도메인/종류 (구분값)',
    example: 'DEPOSIT_SUCCESS',
  })
  type!: string;

  @ApiProperty({ description: '실제 비즈니스 데이터' })
  payload!: T;

  @ApiProperty({
    description: '발송 시간',
    example: '2024-03-05T20:15:00.000Z',
  })
  timestamp!: string;

  static create<T>(type: string, payload: T): SocketEventDto<T> {
    return {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
  }
}
