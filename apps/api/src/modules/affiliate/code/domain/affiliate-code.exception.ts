// src/modules/affiliate/code/domain/affiliate-code.exception.ts
export class AffiliateCodeException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AffiliateCodeException';
  }
}

export class AffiliateCodeLimitExceededException extends AffiliateCodeException {
  constructor(maxCodes: number) {
    super(`Maximum ${maxCodes} codes allowed per user`);
    this.name = 'AffiliateCodeLimitExceededException';
  }
}

export class AffiliateCodeAlreadyExistsException extends AffiliateCodeException {
  constructor(code: string) {
    super(`Code '${code}' already exists`);
    this.name = 'AffiliateCodeAlreadyExistsException';
  }
}

export class AffiliateCodeNotFoundException extends AffiliateCodeException {
  constructor(id?: string) {
    super(id ? `Affiliate code '${id}' not found` : 'Affiliate code not found');
    this.name = 'AffiliateCodeNotFoundException';
  }
}

export class AffiliateCodeCannotDeleteException extends AffiliateCodeException {
  constructor() {
    super('Cannot delete the only default code');
    this.name = 'AffiliateCodeCannotDeleteException';
  }
}
