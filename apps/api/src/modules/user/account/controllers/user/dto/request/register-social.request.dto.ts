import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OAuthProvider } from '@prisma/client';
import { Transform } from 'class-transformer';

export class RegisterSocialRequestDto {
  @ApiProperty({
    description:
      'OAuth Provider (GOOGLE, APPLE, TELEGRAM) / 소셜 로그인 공급자',
    enum: OAuthProvider,
  })
  @IsEnum(OAuthProvider)
  provider: OAuthProvider;

  @ApiProperty({
    description:
      'OAuth Subject ID (Provided by OAuth platform) / 소셜 고유 식별자',
    example: '1234567890',
  })
  @IsNotEmpty()
  @IsString()
  oauthId: string;

  @ApiPropertyOptional({
    description: 'Email (Optional from OAuth) / 이메일',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  email?: string;

  @ApiPropertyOptional({
    description: 'Referral code / 추천인 코드',
    example: 'REFERRAL123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, {
    message: 'Referral code must be at most 20 characters long.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  referralCode?: string;
}
