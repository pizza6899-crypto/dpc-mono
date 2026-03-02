import { ApiPropertyOptional } from '@nestjs/swagger';
import { ExchangeCurrencyCode, UserStatus, UserRoleType } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateUserAdminRequestDto {
  @ApiPropertyOptional({
    description: 'User Email / 이메일 변경 (Optional)',
    example: 'new.email@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'User Nickname / 닉네임 변경 (Optional)',
    example: '새로운닉네임',
  })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({
    description: 'User Status / 계정 상태 변경 (Optional)',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'User Role / 권한 변경 (Optional)',
    enum: UserRoleType,
    example: UserRoleType.USER,
  })
  @IsOptional()
  @IsEnum(UserRoleType)
  role?: UserRoleType;

  @ApiPropertyOptional({
    description: 'Primary Currency / 대표 통화 변경 (Optional)',
    enum: ExchangeCurrencyCode,
    example: ExchangeCurrencyCode.USD,
  })
  @IsOptional()
  @IsEnum(ExchangeCurrencyCode)
  primaryCurrency?: ExchangeCurrencyCode;

  @ApiPropertyOptional({
    description: 'Play Currency / 게임 통화 변경 (Optional)',
    enum: ExchangeCurrencyCode,
    example: ExchangeCurrencyCode.USD,
  })
  @IsOptional()
  @IsEnum(ExchangeCurrencyCode)
  playCurrency?: ExchangeCurrencyCode;
}
