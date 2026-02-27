import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterRequestDto {
  @ApiProperty({
    description: 'Email / 이메일',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format.' })
  email: string;

  @ApiProperty({
    description: 'Password / 비밀번호',
    example: 'password123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @Matches(/^(?=.{8,20}$)(?=.*[a-z])(?=.*\d).+$/, {
    message: 'Password must include at least one letter and one number.',
  })
  password: string;

  @ApiPropertyOptional({
    description: 'Referral code / 추천인 코드',
    example: 'REFERRAL123',
  })
  @IsOptional()
  @IsString()
  @MinLength(6, {
    message: 'Referral code must be at least 6 characters long.',
  })
  @MaxLength(20, {
    message: 'Referral code must be at most 20 characters long.',
  })
  referralCode?: string;
}
