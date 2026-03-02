import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class FindLoginAttemptsQueryDto {
  @ApiPropertyOptional({
    description: 'Login ID Filter / 로그인 ID 필터',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsString()
  loginId?: string;

  @ApiPropertyOptional({
    description: 'IP Address Filter / IP 주소 필터',
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({
    description:
      'Max Count to Retrieve / 조회할 최대 개수 (기본값: 50, 최대: 100)',
    example: 50,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
