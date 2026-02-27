import {
  IsEmail,
  IsString,
  IsOptional,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class RegisterRequestDto {
  @ApiPropertyOptional({
    description: 'Login ID (Email/Phone/Username) / 로그인 아이디',
    example: 'user123',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  loginId?: string;

  @ApiPropertyOptional({
    description: 'Email / 이메일',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  email?: string;

  @ApiProperty({
    description: 'Password / 비밀번호',
    example: 'password123!',
  })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    description: 'Phone Number / 휴대폰 번호',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Nickname / 닉네임',
    example: 'superhero',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  nickname?: string;

  @ApiPropertyOptional({
    description: 'Birth Date (YYYY-MM-DD) / 생년월일',
    example: '1990-01-01',
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

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
