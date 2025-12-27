// src/modules/affiliate/referral/domain/model/user-referral-stats.entity.spec.ts
import { UserReferralStats } from './user-referral-stats.entity';

describe('UserReferralStats', () => {
  const mockUserId = 'user-123';
  const createdAt = new Date('2024-01-01T00:00:00Z');
  const updatedAt = new Date('2024-01-02T00:00:00Z');

  const createDefaultStats = () =>
    UserReferralStats.fromPersistence({
      userId: mockUserId,
      totalReferrals: 10,
      activeReferrals: 8,
      totalEarnings: 1000000n,
      pendingCommissions: 500000n,
      pendingMilestones: 200000n,
      totalMilestones: 300000n,
      currentTier: 2,
      tierProgress: 50,
      monthlyWager: 5000000n,
      monthlyEarnings: 300000n,
      monthlyReferrals: 3,
      createdAt,
      updatedAt,
    });

  describe('fromPersistence', () => {
    it('DB 데이터로부터 통계 엔티티를 생성한다', () => {
      const stats = createDefaultStats();

      expect(stats.userId).toBe(mockUserId);
      expect(stats.totalReferrals).toBe(10);
      expect(stats.activeReferrals).toBe(8);
      expect(stats.totalEarnings).toBe(1000000n);
      expect(stats.pendingCommissions).toBe(500000n);
      expect(stats.pendingMilestones).toBe(200000n);
      expect(stats.totalMilestones).toBe(300000n);
      expect(stats.currentTier).toBe(2);
      expect(stats.tierProgress).toBe(50);
      expect(stats.monthlyWager).toBe(5000000n);
      expect(stats.monthlyEarnings).toBe(300000n);
      expect(stats.monthlyReferrals).toBe(3);
      expect(stats.createdAt).toEqual(createdAt);
      expect(stats.updatedAt).toEqual(updatedAt);
    });

    it('BigInt 문자열을 올바르게 변환한다', () => {
      const stats = UserReferralStats.fromPersistence({
        userId: mockUserId,
        totalReferrals: 5,
        activeReferrals: 3,
        totalEarnings: '2000000',
        pendingCommissions: '1000000',
        pendingMilestones: '500000',
        totalMilestones: '1500000',
        currentTier: 1,
        tierProgress: 25,
        monthlyWager: '3000000',
        monthlyEarnings: '200000',
        monthlyReferrals: 2,
        createdAt,
        updatedAt,
      });

      expect(stats.totalEarnings).toBe(2000000n);
      expect(stats.pendingCommissions).toBe(1000000n);
      expect(stats.pendingMilestones).toBe(500000n);
      expect(stats.totalMilestones).toBe(1500000n);
      expect(stats.monthlyWager).toBe(3000000n);
      expect(stats.monthlyEarnings).toBe(200000n);
    });

    it('초기값(0)으로 통계 엔티티를 생성한다', () => {
      const stats = UserReferralStats.fromPersistence({
        userId: mockUserId,
        totalReferrals: 0,
        activeReferrals: 0,
        totalEarnings: 0n,
        pendingCommissions: 0n,
        pendingMilestones: 0n,
        totalMilestones: 0n,
        currentTier: 0,
        tierProgress: 0,
        monthlyWager: 0n,
        monthlyEarnings: 0n,
        monthlyReferrals: 0,
        createdAt,
        updatedAt,
      });

      expect(stats.totalReferrals).toBe(0);
      expect(stats.activeReferrals).toBe(0);
      expect(stats.totalEarnings).toBe(0n);
      expect(stats.pendingCommissions).toBe(0n);
      expect(stats.pendingMilestones).toBe(0n);
      expect(stats.totalMilestones).toBe(0n);
    });
  });

  describe('getTotalPending', () => {
    it('커미션과 마일스톤의 합계를 반환한다', () => {
      const stats = createDefaultStats();

      expect(stats.getTotalPending()).toBe(700000n); // 500000 + 200000
    });

    it('대기 중인 금액이 없으면 0을 반환한다', () => {
      const stats = UserReferralStats.fromPersistence({
        userId: mockUserId,
        totalReferrals: 0,
        activeReferrals: 0,
        totalEarnings: 0n,
        pendingCommissions: 0n,
        pendingMilestones: 0n,
        totalMilestones: 0n,
        currentTier: 0,
        tierProgress: 0,
        monthlyWager: 0n,
        monthlyEarnings: 0n,
        monthlyReferrals: 0,
        createdAt,
        updatedAt,
      });

      expect(stats.getTotalPending()).toBe(0n);
    });
  });

  describe('addReferral', () => {
    it('레퍼럴 수를 증가시킨다', () => {
      const stats = createDefaultStats();
      const initialTotal = stats.totalReferrals;
      const initialActive = stats.activeReferrals;
      const initialMonthly = stats.monthlyReferrals;

      stats.addReferral();

      expect(stats.totalReferrals).toBe(initialTotal + 1);
      expect(stats.activeReferrals).toBe(initialActive + 1);
      expect(stats.monthlyReferrals).toBe(initialMonthly + 1);
    });

    it('여러 번 호출 시 누적된다', () => {
      const stats = createDefaultStats();

      stats.addReferral();
      stats.addReferral();
      stats.addReferral();

      expect(stats.totalReferrals).toBe(13); // 10 + 3
      expect(stats.activeReferrals).toBe(11); // 8 + 3
      expect(stats.monthlyReferrals).toBe(6); // 3 + 3
    });
  });

  describe('decreaseActiveReferrals', () => {
    it('활성 레퍼럴 수를 감소시킨다', () => {
      const stats = createDefaultStats();
      const initialActive = stats.activeReferrals;

      stats.decreaseActiveReferrals();

      expect(stats.activeReferrals).toBe(initialActive - 1);
      expect(stats.totalReferrals).toBe(10); // 변경되지 않음
    });

    it('활성 레퍼럴이 0이면 감소하지 않는다', () => {
      const stats = UserReferralStats.fromPersistence({
        userId: mockUserId,
        totalReferrals: 5,
        activeReferrals: 0,
        totalEarnings: 0n,
        pendingCommissions: 0n,
        pendingMilestones: 0n,
        totalMilestones: 0n,
        currentTier: 0,
        tierProgress: 0,
        monthlyWager: 0n,
        monthlyEarnings: 0n,
        monthlyReferrals: 0,
        createdAt,
        updatedAt,
      });

      stats.decreaseActiveReferrals();

      expect(stats.activeReferrals).toBe(0);
    });
  });

  describe('addPendingCommission', () => {
    it('대기 중인 커미션을 추가한다', () => {
      const stats = createDefaultStats();
      const initialPending = stats.pendingCommissions;
      const initialMonthly = stats.monthlyEarnings;

      stats.addPendingCommission(100000n);

      expect(stats.pendingCommissions).toBe(initialPending + 100000n);
      expect(stats.monthlyEarnings).toBe(initialMonthly + 100000n);
    });

    it('여러 번 호출 시 누적된다', () => {
      const stats = createDefaultStats();

      stats.addPendingCommission(100000n);
      stats.addPendingCommission(200000n);

      expect(stats.pendingCommissions).toBe(800000n); // 500000 + 100000 + 200000
    });
  });

  describe('payCommission', () => {
    it('커미션을 지급하고 총 수익에 추가한다', () => {
      const stats = createDefaultStats();
      const initialPending = stats.pendingCommissions;
      const initialTotal = stats.totalEarnings;

      stats.payCommission(200000n);

      expect(stats.pendingCommissions).toBe(initialPending - 200000n);
      expect(stats.totalEarnings).toBe(initialTotal + 200000n);
    });

    it('대기 중인 커미션이 부족하면 예외를 발생시킨다', () => {
      const stats = createDefaultStats();

      expect(() => {
        stats.payCommission(1000000n); // 500000보다 큼
      }).toThrow('대기 중인 커미션이 부족합니다');
    });

    it('정확한 금액만큼 지급한다', () => {
      const stats = createDefaultStats();

      stats.payCommission(500000n);

      expect(stats.pendingCommissions).toBe(0n);
      expect(stats.totalEarnings).toBe(1500000n); // 1000000 + 500000
    });
  });

  describe('addPendingMilestone', () => {
    it('대기 중인 마일스톤을 추가한다', () => {
      const stats = createDefaultStats();
      const initialPending = stats.pendingMilestones;

      stats.addPendingMilestone(100000n);

      expect(stats.pendingMilestones).toBe(initialPending + 100000n);
    });

    it('여러 번 호출 시 누적된다', () => {
      const stats = createDefaultStats();

      stats.addPendingMilestone(100000n);
      stats.addPendingMilestone(150000n);

      expect(stats.pendingMilestones).toBe(450000n); // 200000 + 100000 + 150000
    });
  });

  describe('claimMilestone', () => {
    it('마일스톤을 클레임하고 총 수익에 추가한다', () => {
      const stats = createDefaultStats();
      const initialPending = stats.pendingMilestones;
      const initialTotal = stats.totalMilestones;
      const initialEarnings = stats.totalEarnings;

      stats.claimMilestone(100000n);

      expect(stats.pendingMilestones).toBe(initialPending - 100000n);
      expect(stats.totalMilestones).toBe(initialTotal + 100000n);
      expect(stats.totalEarnings).toBe(initialEarnings + 100000n);
    });

    it('대기 중인 마일스톤이 부족하면 예외를 발생시킨다', () => {
      const stats = createDefaultStats();

      expect(() => {
        stats.claimMilestone(500000n); // 200000보다 큼
      }).toThrow('대기 중인 마일스톤이 부족합니다');
    });

    it('정확한 금액만큼 클레임한다', () => {
      const stats = createDefaultStats();

      stats.claimMilestone(200000n);

      expect(stats.pendingMilestones).toBe(0n);
      expect(stats.totalMilestones).toBe(500000n); // 300000 + 200000
      expect(stats.totalEarnings).toBe(1200000n); // 1000000 + 200000
    });
  });

  describe('resetMonthlyStats', () => {
    it('월간 통계를 리셋한다', () => {
      const stats = createDefaultStats();

      stats.resetMonthlyStats();

      expect(stats.monthlyWager).toBe(0n);
      expect(stats.monthlyEarnings).toBe(0n);
      expect(stats.monthlyReferrals).toBe(0);
    });

    it('다른 통계는 변경하지 않는다', () => {
      const stats = createDefaultStats();
      const initialTotal = stats.totalReferrals;
      const initialEarnings = stats.totalEarnings;

      stats.resetMonthlyStats();

      expect(stats.totalReferrals).toBe(initialTotal);
      expect(stats.totalEarnings).toBe(initialEarnings);
    });
  });

  describe('updateTier', () => {
    it('티어와 진행도를 업데이트한다', () => {
      const stats = createDefaultStats();

      stats.updateTier(3, 75);

      expect(stats.currentTier).toBe(3);
      expect(stats.tierProgress).toBe(75);
    });

    it('진행도가 0 미만이면 0으로 제한한다', () => {
      const stats = createDefaultStats();

      stats.updateTier(1, -10);

      expect(stats.tierProgress).toBe(0);
    });

    it('진행도가 100 초과이면 100으로 제한한다', () => {
      const stats = createDefaultStats();

      stats.updateTier(1, 150);

      expect(stats.tierProgress).toBe(100);
    });

    it('0과 100 사이의 값은 그대로 유지한다', () => {
      const stats = createDefaultStats();

      stats.updateTier(2, 50);

      expect(stats.tierProgress).toBe(50);
    });
  });

  describe('addMonthlyWager', () => {
    it('월간 베팅액을 추가한다', () => {
      const stats = createDefaultStats();
      const initialWager = stats.monthlyWager;

      stats.addMonthlyWager(1000000n);

      expect(stats.monthlyWager).toBe(initialWager + 1000000n);
    });

    it('여러 번 호출 시 누적된다', () => {
      const stats = createDefaultStats();

      stats.addMonthlyWager(1000000n);
      stats.addMonthlyWager(2000000n);

      expect(stats.monthlyWager).toBe(8000000n); // 5000000 + 1000000 + 2000000
    });
  });

  describe('toPersistence', () => {
    it('DB 저장을 위한 데이터를 올바르게 변환한다', () => {
      const stats = createDefaultStats();

      const persistence = stats.toPersistence();

      expect(persistence).toEqual({
        userId: mockUserId,
        totalReferrals: 10,
        activeReferrals: 8,
        totalEarnings: '1000000',
        pendingCommissions: '500000',
        pendingMilestones: '200000',
        totalMilestones: '300000',
        currentTier: 2,
        tierProgress: 50,
        monthlyWager: '5000000',
        monthlyEarnings: '300000',
        monthlyReferrals: 3,
        createdAt,
        updatedAt,
      });
    });

    it('BigInt 값을 문자열로 변환한다', () => {
      const stats = UserReferralStats.fromPersistence({
        userId: mockUserId,
        totalReferrals: 0,
        activeReferrals: 0,
        totalEarnings: 999999999999999999n,
        pendingCommissions: 123456789012345678n,
        pendingMilestones: 987654321098765432n,
        totalMilestones: 111111111111111111n,
        currentTier: 0,
        tierProgress: 0,
        monthlyWager: 555555555555555555n,
        monthlyEarnings: 777777777777777777n,
        monthlyReferrals: 0,
        createdAt,
        updatedAt,
      });

      const persistence = stats.toPersistence();

      expect(persistence.totalEarnings).toBe('999999999999999999');
      expect(persistence.pendingCommissions).toBe('123456789012345678');
      expect(persistence.pendingMilestones).toBe('987654321098765432');
      expect(persistence.totalMilestones).toBe('111111111111111111');
      expect(persistence.monthlyWager).toBe('555555555555555555');
      expect(persistence.monthlyEarnings).toBe('777777777777777777');
    });
  });
});
