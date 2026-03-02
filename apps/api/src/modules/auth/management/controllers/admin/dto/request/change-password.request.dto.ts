import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AdminChangePasswordRequestDto {
  @ApiProperty({
    description: 'Current Password / 현재 비밀번호',
    example: 'currentPassword123!',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description: 'New Password / 새 비밀번호',
    example: 'newPassword123!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
