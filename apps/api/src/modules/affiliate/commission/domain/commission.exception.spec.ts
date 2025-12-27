// src/modules/affiliate/commission/domain/commission.exception.spec.ts

import {
  CommissionException,
  InvalidCommissionRateException,
  InsufficientBalanceException,
  CommissionNotFoundException,
  CommissionNotAvailableException,
  WalletNotFoundException,
  TierNotFoundException,
  InvalidCommissionCalculationException,
  InvalidSettlementDateException,
  InvalidWalletBalanceException,
  InvalidParameterException,
} from './commission.exception';

describe('CommissionException', () => {
  describe('CommissionException', () => {
    it('예외 메시지와 함께 예외를 생성한다', () => {
      // Given
      const message = 'Test error message';

      // When
      const exception = new CommissionException(message);

      // Then
      expect(exception).toBeInstanceOf(Error);
      expect(exception).toBeInstanceOf(CommissionException);
      expect(exception.message).toBe(message);
      expect(exception.name).toBe('CommissionException');
    });
  });

  describe('InvalidCommissionRateException', () => {
    it('요율과 함께 예외를 생성한다', () => {
      // Given
      const rate = 0n;

      // When
      const exception = new InvalidCommissionRateException(rate);

      // Then
      expect(exception).toBeInstanceOf(CommissionException);
      expect(exception.message).toBe(
        'Invalid commission rate: 0. Rate must be between 1 and 10000 (0.01% - 100%)',
      );
      expect(exception.name).toBe('InvalidCommissionRateException');
    });

    it('범위를 벗어난 요율에 대한 메시지를 포함한다', () => {
      // Given
      const rate = 10001n;

      // When
      const exception = new InvalidCommissionRateException(rate);

      // Then
      expect(exception.message).toContain('10001');
      expect(exception.message).toContain('1 and 10000');
    });

    it('큰 BigInt 값도 올바르게 처리한다', () => {
      // Given
      const rate = 999999999999n;

      // When
      const exception = new InvalidCommissionRateException(rate);

      // Then
      expect(exception.message).toContain('999999999999');
    });
  });

  describe('InsufficientBalanceException', () => {
    it('사용 가능한 잔액과 요청 금액과 함께 예외를 생성한다', () => {
      // Given
      const availableBalance = 100000n;
      const requestedAmount = 200000n;

      // When
      const exception = new InsufficientBalanceException(
        availableBalance,
        requestedAmount,
      );

      // Then
      expect(exception).toBeInstanceOf(CommissionException);
      expect(exception.message).toBe(
        'Insufficient balance. Available: 100000, Requested: 200000',
      );
      expect(exception.name).toBe('InsufficientBalanceException');
    });

    it('0 잔액에 대한 예외를 생성한다', () => {
      // Given
      const availableBalance = 0n;
      const requestedAmount = 10000n;

      // When
      const exception = new InsufficientBalanceException(
        availableBalance,
        requestedAmount,
      );

      // Then
      expect(exception.message).toBe(
        'Insufficient balance. Available: 0, Requested: 10000',
      );
    });

    it('큰 BigInt 값도 올바르게 처리한다', () => {
      // Given
      const availableBalance = 1000000000n;
      const requestedAmount = 2000000000n;

      // When
      const exception = new InsufficientBalanceException(
        availableBalance,
        requestedAmount,
      );

      // Then
      expect(exception.message).toBe(
        'Insufficient balance. Available: 1000000000, Requested: 2000000000',
      );
    });
  });

  describe('CommissionNotFoundException', () => {
    it('커미션 ID와 함께 예외를 생성한다', () => {
      // Given
      const commissionId = 'commission-123';

      // When
      const exception = new CommissionNotFoundException(commissionId);

      // Then
      expect(exception).toBeInstanceOf(CommissionException);
      expect(exception.message).toBe('Commission not found: commission-123');
      expect(exception.name).toBe('CommissionNotFoundException');
    });

    it('다양한 형식의 커미션 ID를 처리한다', () => {
      // Given
      const commissionId = 'cm_abc123xyz';

      // When
      const exception = new CommissionNotFoundException(commissionId);

      // Then
      expect(exception.message).toBe('Commission not found: cm_abc123xyz');
    });
  });

  describe('CommissionNotAvailableException', () => {
    it('커스텀 메시지와 함께 예외를 생성한다', () => {
      // Given
      const message = 'Commission is already settled';

      // When
      const exception = new CommissionNotAvailableException(message);

      // Then
      expect(exception).toBeInstanceOf(CommissionException);
      expect(exception.message).toBe(message);
      expect(exception.name).toBe('CommissionNotAvailableException');
    });

    it('다양한 상태 메시지를 처리한다', () => {
      // Given
      const message = 'Commission is locked and cannot be modified';

      // When
      const exception = new CommissionNotAvailableException(message);

      // Then
      expect(exception.message).toBe(message);
    });
  });

  describe('WalletNotFoundException', () => {
    it('어필리에이트 ID와 통화와 함께 예외를 생성한다', () => {
      // Given
      const affiliateId = 'affiliate-123';
      const currency = 'USD';

      // When
      const exception = new WalletNotFoundException(affiliateId, currency);

      // Then
      expect(exception).toBeInstanceOf(CommissionException);
      expect(exception.message).toBe(
        'Wallet not found for affiliate: affiliate-123, currency: USD',
      );
      expect(exception.name).toBe('WalletNotFoundException');
    });

    it('다양한 통화 코드를 처리한다', () => {
      // Given
      const affiliateId = 'affiliate-456';
      const currency = 'KRW';

      // When
      const exception = new WalletNotFoundException(affiliateId, currency);

      // Then
      expect(exception.message).toContain('affiliate-456');
      expect(exception.message).toContain('KRW');
    });
  });

  describe('TierNotFoundException', () => {
    it('어필리에이트 ID와 함께 예외를 생성한다', () => {
      // Given
      const affiliateId = 'affiliate-123';

      // When
      const exception = new TierNotFoundException(affiliateId);

      // Then
      expect(exception).toBeInstanceOf(CommissionException);
      expect(exception.message).toBe(
        'Tier not found for affiliate: affiliate-123',
      );
      expect(exception.name).toBe('TierNotFoundException');
    });

    it('다양한 형식의 어필리에이트 ID를 처리한다', () => {
      // Given
      const affiliateId = 'aff_xyz789';

      // When
      const exception = new TierNotFoundException(affiliateId);

      // Then
      expect(exception.message).toBe(
        'Tier not found for affiliate: aff_xyz789',
      );
    });
  });

  describe('InvalidCommissionCalculationException', () => {
    it('모든 계산 파라미터와 함께 예외를 생성한다', () => {
      // Given
      const wagerAmount = '10000.50';
      const rateApplied = '0.05';
      const expectedCommission = '500.025';
      const actualCommission = '500.00';

      // When
      const exception = new InvalidCommissionCalculationException(
        wagerAmount,
        rateApplied,
        expectedCommission,
        actualCommission,
      );

      // Then
      expect(exception).toBeInstanceOf(CommissionException);
      expect(exception.message).toBe(
        'Invalid commission calculation. wagerAmount: 10000.50, rateApplied: 0.05, expected: 500.025, actual: 500.00',
      );
      expect(exception.name).toBe('InvalidCommissionCalculationException');
    });

    it('큰 금액 값도 올바르게 처리한다', () => {
      // Given
      const wagerAmount = '1000000.00';
      const rateApplied = '0.10';
      const expectedCommission = '100000.00';
      const actualCommission = '99999.99';

      // When
      const exception = new InvalidCommissionCalculationException(
        wagerAmount,
        rateApplied,
        expectedCommission,
        actualCommission,
      );

      // Then
      expect(exception.message).toContain('1000000.00');
      expect(exception.message).toContain('100000.00');
      expect(exception.message).toContain('99999.99');
    });
  });

  describe('InvalidSettlementDateException', () => {
    it('정산일과 생성일과 함께 예외를 생성한다', () => {
      // Given
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const settlementDate = new Date('2023-12-31T00:00:00Z');

      // When
      const exception = new InvalidSettlementDateException(
        settlementDate,
        createdAt,
      );

      // Then
      expect(exception).toBeInstanceOf(CommissionException);
      expect(exception.message).toContain('Settlement date');
      expect(exception.message).toContain('cannot be before creation date');
      expect(exception.message).toContain('2023-12-31');
      expect(exception.message).toContain('2024-01-01');
      expect(exception.name).toBe('InvalidSettlementDateException');
    });

    it('ISO 형식의 날짜 문자열을 포함한다', () => {
      // Given
      const createdAt = new Date('2024-06-15T10:30:00Z');
      const settlementDate = new Date('2024-06-14T10:30:00Z');

      // When
      const exception = new InvalidSettlementDateException(
        settlementDate,
        createdAt,
      );

      // Then
      expect(exception.message).toContain(settlementDate.toISOString());
      expect(exception.message).toContain(createdAt.toISOString());
    });
  });

  describe('InvalidWalletBalanceException', () => {
    it('커스텀 메시지와 함께 예외를 생성한다', () => {
      // Given
      const message = 'Wallet balance cannot be negative';

      // When
      const exception = new InvalidWalletBalanceException(message);

      // Then
      expect(exception).toBeInstanceOf(CommissionException);
      expect(exception.message).toBe(message);
      expect(exception.name).toBe('InvalidWalletBalanceException');
    });

    it('다양한 잔액 오류 메시지를 처리한다', () => {
      // Given
      const message = 'Wallet balance exceeds maximum allowed limit';

      // When
      const exception = new InvalidWalletBalanceException(message);

      // Then
      expect(exception.message).toBe(message);
    });
  });

  describe('InvalidParameterException', () => {
    it('커스텀 메시지와 함께 예외를 생성한다', () => {
      // Given
      const message = 'Either uid or id must be provided';

      // When
      const exception = new InvalidParameterException(message);

      // Then
      expect(exception).toBeInstanceOf(CommissionException);
      expect(exception.message).toBe(message);
      expect(exception.name).toBe('InvalidParameterException');
    });

    it('다양한 파라미터 오류 메시지를 처리한다', () => {
      // Given
      const message = 'Invalid parameter: missing required field';

      // When
      const exception = new InvalidParameterException(message);

      // Then
      expect(exception.message).toBe(message);
      expect(exception.name).toBe('InvalidParameterException');
    });
  });
});
