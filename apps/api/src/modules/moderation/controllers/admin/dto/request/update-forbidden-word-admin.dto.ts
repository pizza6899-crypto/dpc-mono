import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateForbiddenWordAdminDto {
  @ApiPropertyOptional({
    description: 'Description / 설명',
    example: 'Manual block update',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Active status / 활성화 여부',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
