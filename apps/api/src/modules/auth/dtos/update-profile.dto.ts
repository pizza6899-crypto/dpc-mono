import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCountryDto {
  @ApiPropertyOptional({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'KR',
    minLength: 2,
    maxLength: 2,
  })
  @IsOptional()
  @IsString()
  @Length(2, 2, { message: 'Country code must be exactly 2 characters long.' })
  @Matches(/^[A-Z]{2}$/, {
    message: 'Country code must be 2 uppercase letters (e.g., KR, JP, US).',
  })
  countryCode?: string;

  // 다른 프로필 필드들도 필요에 따라 추가 가능
}

export class UpdateCountryResponseDto {
  @ApiProperty({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'KR',
  })
  countryCode: string;
}
