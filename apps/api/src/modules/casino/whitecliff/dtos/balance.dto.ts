import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class GetWhitecliffBalanceRequestDto {
  @ApiProperty({
    description: 'User ID of WHITECLIFF (화이트클리프 사용자 ID)',
    example: '1000011',
  })
  @IsNumber()
  user_id: number;

  @ApiPropertyOptional({
    description: `Product's ID (상품 ID). 
    This field can be IGNORED if the integrator does not have a separate wallet. (통합사가 별도의 지갑이 없는 경우 이 필드는 무시해도 됩니다.)`,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  prd_id: number;

  @ApiPropertyOptional({
    description: 'Session ID (세션 ID)',
    example: '49ccfa959657fca7e0abc7774d0f3a7d',
  })
  @IsOptional()
  @IsString()
  sid: string;
}

export class GetWhitecliffBalanceResponseDto {
  @ApiProperty({
    description: `Status (상태)
    0 = error오류
    1 = success성공
    `,
    example: 1,
  })
  status: number;

  @ApiProperty({
    description:
      'Latest balance of the user (사용자의 최신 잔액), decimal(15,2)',
    example: 10000.0,
  })
  balance: number;

  @ApiProperty({
    description: `Error (에러 메시지)
    ACCESS_DENIED
    Integrator's credentials are invalid.
    사이트의 증명서 불일치 (code/token).

    INVALID_USER
    The user is invalid.
    사용자가 존재하지 않을 경우.

    UNKNOWN_ERROR
    Internal error in the integrator's system
    사이트 내부 에러.
    `,
    example: 'ACCESS_DENIED',
  })
  error?: string;
}
