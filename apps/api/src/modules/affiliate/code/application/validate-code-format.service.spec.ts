// src/modules/affiliate/code/application/validate-code-format.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ValidateCodeFormatService } from './validate-code-format.service';

describe('ValidateCodeFormatService', () => {
  let service: ValidateCodeFormatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidateCodeFormatService],
    }).compile();

    service = module.get<ValidateCodeFormatService>(ValidateCodeFormatService);
  });

  describe('execute', () => {
    it('should return true for valid codes', () => {
      expect(service.execute({ code: 'VALID123' })).toBe(true);
      expect(service.execute({ code: 'CODE123456' })).toBe(true);
      expect(service.execute({ code: 'ABC123' })).toBe(true);
      expect(service.execute({ code: '123456' })).toBe(true);
    });

    it('should return false for invalid codes', () => {
      expect(service.execute({ code: 'SHORT' })).toBe(false);
      expect(service.execute({ code: 'VERYLONGCODE12345' })).toBe(false);
      expect(service.execute({ code: 'CODE-123' })).toBe(false);
      expect(service.execute({ code: 'CODE 123' })).toBe(false);
      expect(service.execute({ code: 'code123' })).toBe(false);
      expect(service.execute({ code: '' })).toBe(false);
    });

    it('should validate minimum length (6)', () => {
      expect(service.execute({ code: 'ABC123' })).toBe(true);
      expect(service.execute({ code: 'ABC12' })).toBe(false);
    });

    it('should validate maximum length (12)', () => {
      expect(service.execute({ code: 'ABCDEFGHIJKL' })).toBe(true);
      expect(service.execute({ code: 'ABCDEFGHIJKLM' })).toBe(false);
    });

    it('should validate uppercase and numbers only', () => {
      expect(service.execute({ code: 'UPPER123' })).toBe(true);
      expect(service.execute({ code: 'lower123' })).toBe(false);
      expect(service.execute({ code: 'MIXED123' })).toBe(true);
    });
  });
});
