// src/modules/casino-refactor/domain/exception.ts
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * GameRound 관련 예외
 */
export class GameRoundNotFoundException extends DomainException {
  constructor(identifier: string | bigint) {
    super(`Game round not found: ${identifier}`);
  }
}

export class GameRoundAlreadyExistsException extends DomainException {
  constructor(aggregatorTxId: string, aggregatorType: string) {
    super(
      `Game round already exists: aggregatorTxId=${aggregatorTxId}, aggregatorType=${aggregatorType}`,
    );
  }
}

/**
 * GameBet 관련 예외
 */
export class GameBetNotFoundException extends DomainException {
  constructor(identifier: string | bigint) {
    super(`Game bet not found: ${identifier}`);
  }
}

export class GameBetAlreadyExistsException extends DomainException {
  constructor(aggregatorBetId: string, aggregatorType: string) {
    super(
      `Game bet already exists: aggregatorBetId=${aggregatorBetId}, aggregatorType=${aggregatorType}`,
    );
  }
}

export class GameBetAlreadyCancelledException extends DomainException {
  constructor(identifier: string | bigint) {
    super(`Game bet is already cancelled: ${identifier}`);
  }
}

/**
 * GameWin 관련 예외
 */
export class GameWinNotFoundException extends DomainException {
  constructor(identifier: string | bigint) {
    super(`Game win not found: ${identifier}`);
  }
}

export class GameWinAlreadyExistsException extends DomainException {
  constructor(aggregatorWinId: string, aggregatorType: string) {
    super(
      `Game win already exists: aggregatorWinId=${aggregatorWinId}, aggregatorType=${aggregatorType}`,
    );
  }
}

/**
 * GameSession 관련 예외
 */
export class GameSessionNotFoundException extends DomainException {
  constructor(identifier: string | bigint) {
    super(`Game session not found: ${identifier}`);
  }
}

export class GameSessionAlreadyExistsException extends DomainException {
  constructor(token: string) {
    super(`Game session already exists: token=${token}`);
  }
}

/**
 * Game 관련 예외
 */
export class GameNotFoundException extends DomainException {
  constructor(identifier: number | string) {
    super(`Game not found: ${identifier}`);
  }
}

export class GameAlreadyExistsException extends DomainException {
  constructor(
    aggregatorType: string,
    provider: string,
    aggregatorGameId: number,
  ) {
    super(
      `Game already exists: aggregatorType=${aggregatorType}, provider=${provider}, aggregatorGameId=${aggregatorGameId}`,
    );
  }
}

export class GameNotEnabledException extends DomainException {
  constructor(gameId: number) {
    super(`Game is not enabled: ${gameId}`);
  }
}

export class GameNotVisibleException extends DomainException {
  constructor(gameId: number) {
    super(`Game is not visible to user: ${gameId}`);
  }
}

/**
 * GameTranslation 관련 예외
 */
export class GameTranslationNotFoundException extends DomainException {
  constructor(gameId: bigint, language: string) {
    super(`Game translation not found: gameId=${gameId}, language=${language}`);
  }
}

export class GameTranslationAlreadyExistsException extends DomainException {
  constructor(gameId: bigint, language: string) {
    super(
      `Game translation already exists: gameId=${gameId}, language=${language}`,
    );
  }
}

export class InvalidGameTranslationException extends DomainException {
  constructor(field: string, reason: string) {
    super(`Invalid game translation ${field}: ${reason}`);
  }
}

/**
 * GameBonus 관련 예외
 */
export class GameBonusNotFoundException extends DomainException {
  constructor(identifier: string | bigint) {
    super(`Game bonus not found: ${identifier}`);
  }
}

export class GameBonusAlreadyExistsException extends DomainException {
  constructor(identifiers: {
    aggregatorType: string;
    provider: string;
    aggregatorPromotionId?: string;
    aggregatorRoundId?: string;
    aggregatorWagerId?: string;
    aggregatorTransactionId?: string;
    aggregatorFreespinId?: string;
  }) {
    const identifierStr = JSON.stringify(identifiers);
    super(`Game bonus already exists: ${identifierStr}`);
  }
}

/**
 * 일반 카지노 예외
 */
export class InsufficientFundsException extends DomainException {
  constructor(message?: string) {
    super(message ?? 'Insufficient funds');
  }
}

export class InvalidTransactionException extends DomainException {
  constructor(message?: string) {
    super(message ?? 'Invalid transaction');
  }
}

/**
 * Aggregator API 관련 예외
 */
export class AggregatorApiException extends DomainException {
  constructor(
    aggregatorType: string,
    endpoint: string,
    reason?: string,
  ) {
    const message = reason
      ? `Aggregator API failed: aggregatorType=${aggregatorType}, endpoint=${endpoint}, reason=${reason}`
      : `Aggregator API failed: aggregatorType=${aggregatorType}, endpoint=${endpoint}`;
    super(message);
  }
}

/**
 * 지원하지 않는 애그리게이터 타입 예외
 */
export class UnsupportedAggregatorTypeException extends DomainException {
  constructor(aggregatorType: string) {
    super(`Unsupported aggregator type: ${aggregatorType}`);
  }
}

