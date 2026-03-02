import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateForbiddenWordAdminDto {
  @ApiProperty({
    description: 'Forbidden word / 금지어',
    example: 'abuso',
  })
  @IsNotEmpty()
  @IsString()
  word: string;

  @ApiPropertyOptional({
    description: 'Description / 설명',
    example: 'Manually added word',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
