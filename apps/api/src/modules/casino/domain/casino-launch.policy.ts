import { Injectable } from '@nestjs/common';
import { CasinoGame } from '../game-catalog/domain/model/game.entity';
import { CasinoGameProvider } from '../aggregator/domain/model/casino-game-provider.entity';
import { CasinoAggregator } from '../aggregator/domain/model/casino-aggregator.entity';
import {
  CasinoGameDisabledException,
  CasinoProviderInactiveException,
  CurrencyUnsupportedException,
} from './casino.exception';
import {
  CasinoAggregatorInactiveException,
  CasinoAggregatorMaintenanceException,
} from '../aggregator/domain/casino-aggregator.exception';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import {
  GAMING_CURRENCIES,
  type GamingCurrencyCode,
  WALLET_CURRENCIES,
  type WalletCurrencyCode,
} from 'src/utils/currency.util';

@Injectable()
export class CasinoLaunchPolicy {
  /**
   * 카지노 게임 실행 가능 여부를 통합 검증합니다.
   */
  validate(
    user: AuthenticatedUser,
    game: CasinoGame,
    provider: CasinoGameProvider,
    aggregator: CasinoAggregator,
    currencies: {
      walletCurrency: WalletCurrencyCode;
      gameCurrency: GamingCurrencyCode;
    },
  ): void {
    const { walletCurrency, gameCurrency } = currencies;

    // 0. 통화 검증
    if (!WALLET_CURRENCIES.includes(walletCurrency)) {
      throw new CurrencyUnsupportedException(walletCurrency);
    }

    if (!GAMING_CURRENCIES.includes(gameCurrency)) {
      throw new CurrencyUnsupportedException(gameCurrency);
    }

    // 1. 게임 활성화 체크
    if (!game.isEnabled) {
      throw new CasinoGameDisabledException(game.id!);
    }

    // 2. 프로바이더 활성화 체크
    if (!provider.isActive) {
      throw new CasinoProviderInactiveException(provider.id!);
    }

    // 3. 어그리게이터 상태 체크
    if (!aggregator.isActive()) {
      if (aggregator.isMaintenance()) {
        throw new CasinoAggregatorMaintenanceException(aggregator.code);
      }
      throw new CasinoAggregatorInactiveException(aggregator.code);
    }

    // 4. API 통신 가능 여부 체크
    if (!aggregator.apiEnabled) {
      throw new CasinoAggregatorMaintenanceException(aggregator.code);
    }

    // 5. 유저 상태 체크 (필요한 경우 추가)
    // 예: user.isBannedFromCasino 등
    this.validateUser(user);
  }

  private validateUser(user: AuthenticatedUser): void {
    // 현재는 특별한 제약이 없으나 향후 확장 가능
    // if (user.status === UserStatus.SUSPENDED) ...
  }
}
