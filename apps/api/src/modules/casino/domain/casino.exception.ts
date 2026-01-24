import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class CasinoException extends DomainException {
    constructor(message: string, errorCode: MessageCode, httpStatus: HttpStatus = HttpStatus.BAD_REQUEST) {
        super(message, errorCode, httpStatus);
    }
}

export class CurrencyUnsupportedException extends CasinoException {
    constructor(currency: string) {
        super(`Currency unsupported: ${currency}`, MessageCode.CURRENCY_UNSUPPORTED, HttpStatus.BAD_REQUEST);
    }
}

export class UserBalanceNotFoundException extends CasinoException {
    constructor(userId: bigint, currency: string) {
        super(
            `User balance not found: userId=${userId}, currency=${currency}`,
            MessageCode.USER_BALANCE_NOT_FOUND,
            HttpStatus.NOT_FOUND,
        );
    }
}

export class CasinoGameRoundException extends CasinoException {
    constructor(public readonly casinoErrorCode: string, message: string) {
        super(
            `${message} (Code: ${casinoErrorCode})`,
            (MessageCode as any).INVALID_REQUEST ?? MessageCode.USER_NOT_FOUND, // Fallback to safe code
            HttpStatus.BAD_REQUEST,
        );
    }
}

export class CasinoGameDisabledException extends CasinoException {
    constructor(gameId: bigint) {
        super(`Casino game is disabled: ${gameId}`, MessageCode.GAME_NOT_FOUND, HttpStatus.FORBIDDEN);
    }
}

export class CasinoProviderInactiveException extends CasinoException {
    constructor(providerId: bigint) {
        super(`Casino provider is inactive: ${providerId}`, MessageCode.CASINO_GAME_PROVIDER_NOT_FOUND, HttpStatus.FORBIDDEN);
    }
}
