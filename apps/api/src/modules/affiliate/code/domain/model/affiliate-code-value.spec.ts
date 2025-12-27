// src/modules/affiliate/code/domain/model/affiliate-code-value.spec.ts
import { AffiliateCodeValue } from './affiliate-code-value';
import { AffiliateCodeException } from '../affiliate-code.exception';

describe('AffiliateCodeValue', () => {
  describe('create', () => {
    it('should create valid code value', () => {
      const codeValue = AffiliateCodeValue.create('SUMMER2024');
      expect(codeValue.value).toBe('SUMMER2024');
    });

    it('should throw error for empty code', () => {
      expect(() => {
        AffiliateCodeValue.create('');
      }).toThrow(AffiliateCodeException);
    });

    it('should throw error for code shorter than 6 characters', () => {
      expect(() => {
        AffiliateCodeValue.create('SHORT');
      }).toThrow(AffiliateCodeException);
    });

    it('should throw error for code longer than 12 characters', () => {
      expect(() => {
        AffiliateCodeValue.create('VERYLONGCODE12345');
      }).toThrow(AffiliateCodeException);
    });

    it('should throw error for code with special characters', () => {
      expect(() => {
        AffiliateCodeValue.create('CODE-123');
      }).toThrow(AffiliateCodeException);
    });

    it('should throw error for code with spaces', () => {
      expect(() => {
        AffiliateCodeValue.create('CODE 123');
      }).toThrow(AffiliateCodeException);
    });

    it('should throw error for lowercase letters', () => {
      expect(() => {
        AffiliateCodeValue.create('code123');
      }).toThrow(AffiliateCodeException);
    });

    it('should accept valid codes', () => {
      expect(() => AffiliateCodeValue.create('SUMMER24')).not.toThrow();
      expect(() => AffiliateCodeValue.create('CODE123456')).not.toThrow();
      expect(() => AffiliateCodeValue.create('ABC123')).not.toThrow();
      expect(() => AffiliateCodeValue.create('123456')).not.toThrow();
    });
  });

  describe('validate', () => {
    it('should return true for valid codes', () => {
      expect(AffiliateCodeValue.validate('SUMMER24')).toBe(true);
      expect(AffiliateCodeValue.validate('CODE123456')).toBe(true);
      expect(AffiliateCodeValue.validate('ABC123')).toBe(true);
    });

    it('should return false for invalid codes', () => {
      expect(AffiliateCodeValue.validate('SHORT')).toBe(false);
      expect(AffiliateCodeValue.validate('VERYLONGCODE12345')).toBe(false);
      expect(AffiliateCodeValue.validate('CODE-123')).toBe(false);
      expect(AffiliateCodeValue.validate('CODE 123')).toBe(false);
      expect(AffiliateCodeValue.validate('code123')).toBe(false);
      expect(AffiliateCodeValue.validate('')).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for same code values', () => {
      const code1 = AffiliateCodeValue.create('SUMMER2024');
      const code2 = AffiliateCodeValue.create('SUMMER2024');

      expect(code1.equals(code2)).toBe(true);
    });

    it('should return false for different code values', () => {
      const code1 = AffiliateCodeValue.create('SUMMER2024');
      const code2 = AffiliateCodeValue.create('WINTER2024');

      expect(code1.equals(code2)).toBe(false);
    });
  });

  describe('generate', () => {
    it('should generate code with default length (8)', () => {
      const codeValue = AffiliateCodeValue.generate();
      expect(codeValue.value.length).toBe(8);
      // 대문자와 숫자만 포함되어야 함
      expect(/^[A-Z0-9]+$/.test(codeValue.value)).toBe(true);
    });

    it('should generate code with specified length', () => {
      const codeValue = AffiliateCodeValue.generate(10);
      expect(codeValue.value.length).toBe(10);
      // 대문자와 숫자만 포함되어야 함
      expect(/^[A-Z0-9]+$/.test(codeValue.value)).toBe(true);
    });

    it('should generate code with minimum length (6)', () => {
      const codeValue = AffiliateCodeValue.generate(6);
      expect(codeValue.value.length).toBe(6);
      // 대문자와 숫자만 포함되어야 함
      expect(/^[A-Z0-9]+$/.test(codeValue.value)).toBe(true);
    });

    it('should generate code with maximum length (12)', () => {
      const codeValue = AffiliateCodeValue.generate(12);
      expect(codeValue.value.length).toBe(12);
      // 대문자와 숫자만 포함되어야 함
      expect(/^[A-Z0-9]+$/.test(codeValue.value)).toBe(true);
    });

    it('should throw error for length less than minimum', () => {
      expect(() => {
        AffiliateCodeValue.generate(5);
      }).toThrow(AffiliateCodeException);
    });

    it('should throw error for length greater than maximum', () => {
      expect(() => {
        AffiliateCodeValue.generate(13);
      }).toThrow(AffiliateCodeException);
    });

    it('should generate unique codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const codeValue = AffiliateCodeValue.generate();
        codes.add(codeValue.value);
      }
      // 충돌 가능성이 매우 낮지만, 100개 중 대부분은 고유해야 함
      expect(codes.size).toBeGreaterThan(90);
    });

    it('should generate codes with valid characters (uppercase and numbers)', () => {
      const codeValue = AffiliateCodeValue.generate();
      // 대문자와 숫자만 포함되어야 함
      expect(/^[A-Z0-9]+$/.test(codeValue.value)).toBe(true);
    });
  });
});
