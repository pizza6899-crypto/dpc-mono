import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class RegisterRequestDto {
  @ApiProperty({
    description: 'Login ID (Email/Phone/Username) / 로그인 아이디',
    example: 'user123',
  })
  @IsNotEmpty({ message: 'Login ID is required.' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  loginId: string;

  @ApiProperty({
    description: 'Password / 비밀번호',
    example: 'password123!',
  })
  @IsNotEmpty({ message: 'Password is required.' })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    description: 'Nickname / 닉네임',
    example: 'superhero',
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  nickname?: string;

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
