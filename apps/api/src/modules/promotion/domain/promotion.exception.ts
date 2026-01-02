// src/modules/promotion/domain/promotion.exception.ts
export class PromotionException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PromotionException';
  }
}

export class PromotionNotFoundException extends PromotionException {
  constructor(id?: bigint) {
    super(id ? `Promotion '${id}' not found` : 'Promotion not found');
    this.name = 'PromotionNotFoundException';
  }
}

export class PromotionNotActiveException extends PromotionException {
  constructor(id: bigint) {
    super(`Promotion '${id}' is not active`);
    this.name = 'PromotionNotActiveException';
  }
}

export class PromotionNotEligibleException extends PromotionException {
  constructor(reason: string) {
    super(`Promotion not eligible: ${reason}`);
    this.name = 'PromotionNotEligibleException';
  }
}

export class PromotionAlreadyUsedException extends PromotionException {
  constructor(id: bigint) {
    super(`Promotion '${id}' has already been used`);
    this.name = 'PromotionAlreadyUsedException';
  }
}

export class UserPromotionNotFoundException extends PromotionException {
  constructor(id?: bigint) {
    super(
      id ? `User promotion '${id}' not found` : 'User promotion not found',
    );
    this.name = 'UserPromotionNotFoundException';
  }
}

