// src/modules/affiliate/code/domain/affiliate-code.exception.spec.ts
import {
  AffiliateCodeException,
  AffiliateCodeLimitExceededException,
  AffiliateCodeAlreadyExistsException,
  AffiliateCodeNotFoundException,
  AffiliateCodeCannotDeleteException,
} from './affiliate-code.exception';

describe('AffiliateCodeException', () => {
  describe('AffiliateCodeException', () => {
    it('should create exception with message', () => {
      const exception = new AffiliateCodeException('Test error message');

      expect(exception).toBeInstanceOf(Error);
      expect(exception).toBeInstanceOf(AffiliateCodeException);
      expect(exception.message).toBe('Test error message');
      expect(exception.name).toBe('AffiliateCodeException');
    });
  });

  describe('AffiliateCodeLimitExceededException', () => {
    it('should create exception with max codes message', () => {
      const exception = new AffiliateCodeLimitExceededException(20);

      expect(exception).toBeInstanceOf(AffiliateCodeException);
      expect(exception.message).toBe('Maximum 20 codes allowed per user');
      expect(exception.name).toBe('AffiliateCodeLimitExceededException');
    });

    it('should include max codes in message', () => {
      const exception = new AffiliateCodeLimitExceededException(10);

      expect(exception.message).toBe('Maximum 10 codes allowed per user');
    });
  });

  describe('AffiliateCodeAlreadyExistsException', () => {
    it('should create exception with code message', () => {
      const exception = new AffiliateCodeAlreadyExistsException('SUMMER2024');

      expect(exception).toBeInstanceOf(AffiliateCodeException);
      expect(exception.message).toBe("Code 'SUMMER2024' already exists");
      expect(exception.name).toBe('AffiliateCodeAlreadyExistsException');
    });

    it('should include code in message', () => {
      const exception = new AffiliateCodeAlreadyExistsException('WINTER2024');

      expect(exception.message).toBe("Code 'WINTER2024' already exists");
    });
  });

  describe('AffiliateCodeNotFoundException', () => {
    it('should create exception with id message when id provided', () => {
      const exception = new AffiliateCodeNotFoundException('code-123');

      expect(exception).toBeInstanceOf(AffiliateCodeException);
      expect(exception.message).toBe("Affiliate code 'code-123' not found");
      expect(exception.name).toBe('AffiliateCodeNotFoundException');
    });

    it('should create exception with generic message when id not provided', () => {
      const exception = new AffiliateCodeNotFoundException();

      expect(exception.message).toBe('Affiliate code not found');
      expect(exception.name).toBe('AffiliateCodeNotFoundException');
    });
  });

  describe('AffiliateCodeCannotDeleteException', () => {
    it('should create exception with delete restriction message', () => {
      const exception = new AffiliateCodeCannotDeleteException();

      expect(exception).toBeInstanceOf(AffiliateCodeException);
      expect(exception.message).toBe('Cannot delete the only default code');
      expect(exception.name).toBe('AffiliateCodeCannotDeleteException');
    });
  });
});
