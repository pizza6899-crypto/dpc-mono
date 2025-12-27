import { IsString, IsEmail, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PasswordResetRequestDto {
  @ApiProperty({
    description: 'Email (이메일)',
  })
  @IsString()
  @MaxLength(255, { message: 'Email must be less than 255 characters.' })
  @IsEmail({}, { message: 'Invalid email format.' })
  email: string;
}
