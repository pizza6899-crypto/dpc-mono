import { IsString, MinLength, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PasswordChangeDto {
  @ApiProperty({
    description: 'Current password (현재 비밀번호)',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'New password (새 비밀번호)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @MaxLength(64, { message: 'Password must be less than 64 characters.' })
  newPassword: string;
}
