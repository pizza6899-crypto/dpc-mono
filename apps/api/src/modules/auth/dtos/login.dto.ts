import { IsString, IsEmail, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email (이메일)',
    example: 'user@example.com',
  })
  @IsString()
  @IsEmail({}, { message: 'Invalid email format.' })
  email: string;

  @ApiProperty({
    description: 'Password (비밀번호)',
    example: 'password123!',
    minLength: 8,
  })
  @IsString()
  @Matches(/^(?=.{8,20}$)(?=.*[a-z])(?=.*\d).+$/, {
    message: 'Password must include at least one letter and one number.',
  })
  password: string;
}

export class AdminLoginDto {
  @ApiProperty({
    description: 'Email (이메일)',
    example: 'admin@dpc.com',
  })
  @IsString()
  @IsEmail({}, { message: 'Invalid email format.' })
  email: string;

  @ApiProperty({
    description: 'Password (비밀번호)',
    example: 'admin123!',
    minLength: 8,
  })
  @IsString()
  @Matches(/^(?=.{8,20}$)(?=.*[a-z])(?=.*\d).+$/, {
    message: 'Password must include at least one letter and one number.',
  })
  password: string;
}
