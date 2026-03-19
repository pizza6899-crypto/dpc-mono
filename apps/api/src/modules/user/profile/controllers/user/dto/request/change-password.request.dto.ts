import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ProfileChangePasswordRequestDto {
  @ApiProperty({
    description: 'Current password / 현재 비밀번호',
    example: 'currentPassword123!',
  })
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  @ApiProperty({
    description: 'New password / 새 비밀번호',
    example: 'newPassword123!',
  })
  @IsNotEmpty()
  @IsString()
  newPassword: string;
}
