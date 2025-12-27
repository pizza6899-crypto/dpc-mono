import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthDto {
  @ApiProperty({
    description: 'Google OAuth Access Token',
    example: 'ya29.a0ARrdaM...',
  })
  @IsString()
  accessToken: string;
}

export class GoogleAuthCallbackDto {
  @ApiProperty({
    description: 'Authorization Code from Google',
    example: '4/0AX4XfWh...',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'State parameter for CSRF protection',
    required: false,
  })
  @IsOptional()
  @IsString()
  state?: string;
}

export class SocialUserInfoDto {
  @ApiProperty({ description: 'User ID from social provider' })
  id: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiProperty({ description: 'Display name', required: false })
  name?: string;

  @ApiProperty({ description: 'Profile picture URL', required: false })
  picture?: string;

  @ApiProperty({
    description: 'Provider (google, kakao, naver)',
    example: 'google',
  })
  provider: string;
}

export class SocialAuthResponseDto {
  @ApiProperty({
    description: 'User information',
    type: 'object',
    properties: {
      id: { type: 'string' },
      email: { type: 'string' },
      isNewUser: { type: 'boolean' },
    },
  })
  user: {
    id: string;
    email: string;
    isNewUser: boolean;
  };

  @ApiProperty({ description: 'Whether this is a new user registration' })
  isNewUser: boolean;
}

export class GoogleAuthUrlResponseDto {
  @ApiProperty({ description: 'Google OAuth authorization URL' })
  authUrl: string;

  @ApiProperty({ description: 'State parameter for CSRF protection' })
  state: string;
}
