import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';

export class RegisterAdminRequestDto {
  @ApiProperty({
    description: 'Email',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format.' })
  email: string;

  @ApiProperty({
    description: 'Password',
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
    description: 'User role',
    example: UserRoleType.USER,
    enum: UserRoleType,
    default: UserRoleType.USER,
  })
  @IsOptional()
  @IsEnum(UserRoleType, {
    message: 'Invalid user role.',
  })
  role?: UserRoleType;

  @ApiPropertyOptional({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'KR',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'Timezone',
    example: 'Asia/Seoul',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Referral code',
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
