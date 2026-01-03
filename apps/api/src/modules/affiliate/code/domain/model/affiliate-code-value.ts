import {
  AffiliateCodeException,
  AffiliateCodeInvalidFormatException,
} from '../affiliate-code.exception';

const CODE_MIN_LENGTH = 6;
const CODE_MAX_LENGTH = 12;
const CODE_PATTERN = /^[A-Z0-9]+$/;

export class AffiliateCodeValue {
  private constructor(public readonly value: string) { }

  static create(code: string): AffiliateCodeValue {
    if (!code) {
      throw new AffiliateCodeInvalidFormatException('Empty code');
    }

    if (code.length < CODE_MIN_LENGTH || code.length > CODE_MAX_LENGTH) {
      throw new AffiliateCodeInvalidFormatException(
        `Code must be between ${CODE_MIN_LENGTH} and ${CODE_MAX_LENGTH} characters`,
      );
    }

    if (!CODE_PATTERN.test(code)) {
      throw new AffiliateCodeInvalidFormatException(
        'Code must contain only uppercase letters and numbers',
      );
    }

    return new AffiliateCodeValue(code);
  }

  static validate(code: string): boolean {
    if (!code) return false;
    if (code.length < CODE_MIN_LENGTH || code.length > CODE_MAX_LENGTH) {
      return false;
    }
    return CODE_PATTERN.test(code);
  }

  equals(other: AffiliateCodeValue): boolean {
    return this.value === other.value;
  }

  /**
   * 랜덤 코드 생성 (6-12자, 대문자+숫자)
   * 기본 길이는 8자
   */
  static generate(length: number = 8): AffiliateCodeValue {
    if (length < CODE_MIN_LENGTH || length > CODE_MAX_LENGTH) {
      throw new AffiliateCodeException(
        `Code length must be between ${CODE_MIN_LENGTH} and ${CODE_MAX_LENGTH}`,
      );
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return new AffiliateCodeValue(code);
  }
}
