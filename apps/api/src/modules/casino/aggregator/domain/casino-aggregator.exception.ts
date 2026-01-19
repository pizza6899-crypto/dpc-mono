import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class CasinoAggregatorNotFoundException extends DomainException {
    constructor(identifier: string | bigint) {
        super(`Casino aggregator not found: ${identifier}`, MessageCode.CASINO_AGGREGATOR_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
}

export class CasinoAggregatorInactiveException extends DomainException {
    constructor(code: string) {
        super(`Casino aggregator is inactive: ${code}`, MessageCode.CASINO_AGGREGATOR_INACTIVE, HttpStatus.FORBIDDEN);
    }
}

export class CasinoAggregatorMaintenanceException extends DomainException {
    constructor(code: string) {
        super(`Casino aggregator is under maintenance: ${code}`, MessageCode.CASINO_AGGREGATOR_MAINTENANCE, HttpStatus.SERVICE_UNAVAILABLE);
    }
}

export class CasinoGameProviderNotFoundException extends DomainException {
    constructor(identifier: string | bigint) {
        super(`Casino game provider not found: ${identifier}`, MessageCode.CASINO_GAME_PROVIDER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
}
