import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class ListUserSessionsQueryDto {
  @ApiPropertyOptional({
    description:
      '활성 세션만 조회할지 여부 / Whether to retrieve only active sessions',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  activeOnly?: boolean;
}
