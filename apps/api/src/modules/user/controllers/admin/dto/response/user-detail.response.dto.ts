import { ApiProperty } from '@nestjs/swagger';
import { UserRoleType, UserStatus, ExchangeCurrencyCode } from '@prisma/client';

export class UserDetailResponseDto {
  @ApiProperty({ description: '사용자 ID', example: '1234567890...' })
  id: string;

  @ApiProperty({ description: '이메일', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: '사용자 역할', enum: UserRoleType })
  role: UserRoleType;

  @ApiProperty({ description: '사용자 상태', enum: UserStatus })
  status: UserStatus;

  @ApiProperty({ description: '국가 코드', example: 'KR', nullable: true })
  country: string | null;

  @ApiProperty({ description: '타임존', example: 'Asia/Seoul', nullable: true })
  timezone: string | null;

  @ApiProperty({ description: '가입일' })
  createdAt: Date;

  @ApiProperty({ description: '최종 수정일' })
  updatedAt: Date;

  @ApiProperty({ description: '대표 통화', enum: ExchangeCurrencyCode })
  primaryCurrency: ExchangeCurrencyCode;

  @ApiProperty({ description: '게임 통화', enum: ExchangeCurrencyCode })
  playCurrency: ExchangeCurrencyCode;
}
