// src/modules/affiliate/referral/domain/referral.exception.spec.ts
import {
  ReferralException,
  SelfReferralException,
  DuplicateReferralException,
  ReferralNotFoundException,
  ReferralAccessDeniedException,
  ReferralCodeNotFoundException,
  ReferralCodeInactiveException,
  ReferralCodeExpiredException,
  ReferralCommissionNotFoundException,
  ReferralCommissionInvalidStatusException,
  UserReferralStatsNotFoundException,
  InsufficientPendingAmountException,
} from './referral.exception';

describe('ReferralException', () => {
  describe('ReferralException', () => {
    it('should create exception with message', () => {
      const exception = new ReferralException('Test error message');

      expect(exception).toBeInstanceOf(Error);
      expect(exception).toBeInstanceOf(ReferralException);
      expect(exception.message).toBe('Test error message');
      expect(exception.name).toBe('ReferralException');
    });
  });

  describe('SelfReferralException', () => {
    it('should create exception with self referral message', () => {
      const exception = new SelfReferralException();

      expect(exception).toBeInstanceOf(ReferralException);
      expect(exception.message).toBe('자신을 추천할 수 없습니다');
      expect(exception.name).toBe('SelfReferralException');
    });
  });

  describe('DuplicateReferralException', () => {
    it('should create exception with duplicate message', () => {
      const exception = new DuplicateReferralException();

      expect(exception).toBeInstanceOf(ReferralException);
      expect(exception.message).toBe('이미 레퍼럴 관계가 존재합니다');
      expect(exception.name).toBe('DuplicateReferralException');
    });
  });

  describe('ReferralNotFoundException', () => {
    it('should create exception with id message when id provided', () => {
      const exception = new ReferralNotFoundException('referral-123');

      expect(exception).toBeInstanceOf(ReferralException);
      expect(exception.message).toBe("Referral 'referral-123' not found");
      expect(exception.name).toBe('ReferralNotFoundException');
    });

    it('should create exception with generic message when id not provided', () => {
      const exception = new ReferralNotFoundException();

      expect(exception.message).toBe('Referral not found');
      expect(exception.name).toBe('ReferralNotFoundException');
    });
  });

  describe('ReferralAccessDeniedException', () => {
    it('should create exception with access denied message', () => {
      const exception = new ReferralAccessDeniedException();

      expect(exception).toBeInstanceOf(ReferralException);
      expect(exception.message).toBe('레퍼럴 관계에 대한 접근 권한이 없습니다');
      expect(exception.name).toBe('ReferralAccessDeniedException');
    });
  });

  describe('ReferralCodeNotFoundException', () => {
    it('should create exception with code message when code provided', () => {
      const exception = new ReferralCodeNotFoundException('SUMMER2024');

      expect(exception).toBeInstanceOf(ReferralException);
      expect(exception.message).toBe("Referral code 'SUMMER2024' not found");
      expect(exception.name).toBe('ReferralCodeNotFoundException');
    });

    it('should create exception with generic message when code not provided', () => {
      const exception = new ReferralCodeNotFoundException();

      expect(exception.message).toBe('Referral code not found');
      expect(exception.name).toBe('ReferralCodeNotFoundException');
    });
  });

  describe('ReferralCodeInactiveException', () => {
    it('should create exception with code message when code provided', () => {
      const exception = new ReferralCodeInactiveException('WINTER2024');

      expect(exception).toBeInstanceOf(ReferralException);
      expect(exception.message).toBe("Referral code 'WINTER2024' is inactive");
      expect(exception.name).toBe('ReferralCodeInactiveException');
    });

    it('should create exception with generic message when code not provided', () => {
      const exception = new ReferralCodeInactiveException();

      expect(exception.message).toBe('Referral code is inactive');
      expect(exception.name).toBe('ReferralCodeInactiveException');
    });
  });

  describe('ReferralCodeExpiredException', () => {
    it('should create exception with code message when code provided', () => {
      const exception = new ReferralCodeExpiredException('SPRING2024');

      expect(exception).toBeInstanceOf(ReferralException);
      expect(exception.message).toBe("Referral code 'SPRING2024' has expired");
      expect(exception.name).toBe('ReferralCodeExpiredException');
    });

    it('should create exception with generic message when code not provided', () => {
      const exception = new ReferralCodeExpiredException();

      expect(exception.message).toBe('Referral code has expired');
      expect(exception.name).toBe('ReferralCodeExpiredException');
    });
  });

  describe('ReferralCommissionNotFoundException', () => {
    it('should create exception with id message when id provided', () => {
      const exception = new ReferralCommissionNotFoundException(
        'commission-123',
      );

      expect(exception).toBeInstanceOf(ReferralException);
      expect(exception.message).toBe(
        "Referral commission 'commission-123' not found",
      );
      expect(exception.name).toBe('ReferralCommissionNotFoundException');
    });

    it('should create exception with generic message when id not provided', () => {
      const exception = new ReferralCommissionNotFoundException();

      expect(exception.message).toBe('Referral commission not found');
      expect(exception.name).toBe('ReferralCommissionNotFoundException');
    });
  });

  describe('ReferralCommissionInvalidStatusException', () => {
    it('should create exception with status and expected status message', () => {
      const exception = new ReferralCommissionInvalidStatusException(
        'PENDING',
        'APPROVED',
      );

      expect(exception).toBeInstanceOf(ReferralException);
      expect(exception.message).toBe(
        'Invalid commission status: PENDING. Expected: APPROVED',
      );
      expect(exception.name).toBe('ReferralCommissionInvalidStatusException');
    });

    it('should include both statuses in message', () => {
      const exception = new ReferralCommissionInvalidStatusException(
        'LOCKED',
        'PAID',
      );

      expect(exception.message).toBe(
        'Invalid commission status: LOCKED. Expected: PAID',
      );
    });
  });

  describe('UserReferralStatsNotFoundException', () => {
    it('should create exception with userId message when userId provided', () => {
      const exception = new UserReferralStatsNotFoundException('user-123');

      expect(exception).toBeInstanceOf(ReferralException);
      expect(exception.message).toBe(
        "User referral stats for 'user-123' not found",
      );
      expect(exception.name).toBe('UserReferralStatsNotFoundException');
    });

    it('should create exception with generic message when userId not provided', () => {
      const exception = new UserReferralStatsNotFoundException();

      expect(exception.message).toBe('User referral stats not found');
      expect(exception.name).toBe('UserReferralStatsNotFoundException');
    });
  });

  describe('InsufficientPendingAmountException', () => {
    it('should create exception with available and requested amounts', () => {
      const available = 100000n;
      const requested = 200000n;
      const exception = new InsufficientPendingAmountException(
        available,
        requested,
      );

      expect(exception).toBeInstanceOf(ReferralException);
      expect(exception.message).toBe(
        'Insufficient pending amount. Available: 100000, Requested: 200000',
      );
      expect(exception.name).toBe('InsufficientPendingAmountException');
    });

    it('should handle zero values', () => {
      const exception = new InsufficientPendingAmountException(0n, 50000n);

      expect(exception.message).toBe(
        'Insufficient pending amount. Available: 0, Requested: 50000',
      );
    });

    it('should handle large BigInt values', () => {
      const available = 1000000000n;
      const requested = 2000000000n;
      const exception = new InsufficientPendingAmountException(
        available,
        requested,
      );

      expect(exception.message).toBe(
        'Insufficient pending amount. Available: 1000000000, Requested: 2000000000',
      );
    });
  });
});
