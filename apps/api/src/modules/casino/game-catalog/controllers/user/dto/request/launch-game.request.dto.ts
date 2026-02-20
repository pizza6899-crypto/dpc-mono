import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  WALLET_CURRENCIES,
  type WalletCurrencyCode,
} from 'src/utils/currency.util';
import {
  GAMING_CURRENCIES,
  type GamingCurrencyCode,
} from 'src/utils/currency.util';
import { Language } from '@prisma/client';

export class LaunchGameRequestDto {
  @ApiProperty({
    description: 'Encoded game ID (Sqids) / 인코딩된 게임 ID (Sqids)',
  })
  @IsString()
  @IsNotEmpty()
  gameId: string;

  @ApiProperty({ description: 'Is mobile device / 모바일 기기 여부' })
  @IsBoolean()
  isMobile: boolean;

  @ApiProperty({
    description: 'Wallet currency / 지갑 통화',
    enum: WALLET_CURRENCIES,
  })
  @IsEnum(WALLET_CURRENCIES)
  walletCurrency: WalletCurrencyCode;

  @ApiProperty({
    description: 'Game currency / 게임 통화',
    enum: GAMING_CURRENCIES,
  })
  @IsEnum(GAMING_CURRENCIES)
  gameCurrency: GamingCurrencyCode;

  @ApiPropertyOptional({
    description: 'Preferred language / 기본 언어 설정',
    enum: Language,
  })
  @IsEnum(Language)
  @IsOptional()
  language?: Language;
}
