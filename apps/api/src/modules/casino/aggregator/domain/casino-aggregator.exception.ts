import { DomainException } from 'src/common/exception/domain.exception';

export class CasinoAggregatorNotFoundException extends DomainException {
    constructor(identifier: string | bigint) {
        super(`Casino aggregator not found: ${identifier}`);
    }
}

export class CasinoAggregatorInactiveException extends DomainException {
    constructor(code: string) {
        super(`Casino aggregator is inactive: ${code}`);
    }
}

export class CasinoAggregatorMaintenanceException extends DomainException {
    constructor(code: string) {
        super(`Casino aggregator is under maintenance: ${code}`);
    }
}

export class CasinoGameProviderNotFoundException extends DomainException {
    constructor(identifier: string | bigint) {
        super(`Casino game provider not found: ${identifier}`);
    }
}
