import { ApiPropertyOptional } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class AdminUpdateCompConfigDto {
  @ApiPropertyOptional({
    enum: ExchangeCurrencyCode,
    description: 'Currency to update config for / 설정을 변경할 통화',
  })
  @IsEnum(ExchangeCurrencyCode)
  currency: ExchangeCurrencyCode;

  @ApiPropertyOptional({
    description: 'Enable/Disable comp earning / 콤프 적립 활성화 여부',
  })
  @IsOptional()
  @IsBoolean()
  isEarnEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Enable/Disable comp claiming / 콤프 전환 활성화 여부',
  })
  @IsOptional()
  @IsBoolean()
  isClaimEnabled?: boolean;

  @ApiPropertyOptional({
    description:
      'Allow negative balance for rollbacks / 롤백 시 마이너스 잔액 허용 여부',
  })
  @IsOptional()
  @IsBoolean()
  allowNegativeBalance?: boolean;

  @ApiPropertyOptional({
    description: 'Minimum comp amount per claim / 최소 전환 신청 가능 금액',
    type: 'string',
  })
  @IsOptional()
  @IsNumberString()
  minClaimAmount?: string;

  @ApiPropertyOptional({
    description:
      'Max daily earn limit per user (0 for unlimited) / 유저당 일일 최대 적립 한도 (0=무제한)',
    type: 'string',
  })
  @IsOptional()
  @IsNumberString()
  maxDailyEarnPerUser?: string;

  @ApiPropertyOptional({
    description: 'Comp expiration days / 콤프 소멸 기간 (일 단위)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  expirationDays?: number;

  @ApiPropertyOptional({ description: 'Description/Note / 관리자 메모' })
  @IsOptional()
  @IsString()
  description?: string;
}
