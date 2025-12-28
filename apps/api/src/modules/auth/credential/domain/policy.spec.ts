// src/modules/auth/credential/domain/policy.spec.ts
import { CredentialPolicy } from './policy';
import {
  LoginAttempt,
  LoginAttemptResult,
  LoginFailureReason,
} from './model/login-attempt.entity';

describe('CredentialPolicy', () => {
  let policy: CredentialPolicy;
  const mockUid = 'clx1234567890';
  const mockUserId = 'user-123';
  const mockEmail = 'user@example.com';
  const mockIpAddress = '192.168.1.1';
  const mockUserAgent = 'Mozilla/5.0';
  const baseDate = new Date('2024-01-01T00:00:00Z');

  beforeEach(() => {
    policy = new CredentialPolicy();
  });

  describe('isAccountLocked', () => {
    it('최근 시도가 5개 미만이면 잠기지 않는다', () => {
      const attempts = [
        LoginAttempt.createFailure({
          uid: `${mockUid}-1`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 1000),
        }),
        LoginAttempt.createFailure({
          uid: `${mockUid}-2`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 2000),
        }),
        LoginAttempt.createFailure({
          uid: `${mockUid}-3`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 3000),
        }),
        LoginAttempt.createFailure({
          uid: `${mockUid}-4`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 4000),
        }),
      ];

      expect(policy.isAccountLocked(attempts)).toBe(false);
    });

    it('최근 5번의 시도가 모두 실패하면 잠긴다', () => {
      const attempts = [
        LoginAttempt.createFailure({
          uid: `${mockUid}-1`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 1000),
        }),
        LoginAttempt.createFailure({
          uid: `${mockUid}-2`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 2000),
        }),
        LoginAttempt.createFailure({
          uid: `${mockUid}-3`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 3000),
        }),
        LoginAttempt.createFailure({
          uid: `${mockUid}-4`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 4000),
        }),
        LoginAttempt.createFailure({
          uid: `${mockUid}-5`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 5000),
        }),
      ];

      expect(policy.isAccountLocked(attempts)).toBe(true);
    });

    it('최근 5번 중 하나라도 성공하면 잠기지 않는다', () => {
      const attempts = [
        LoginAttempt.createFailure({
          uid: `${mockUid}-1`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 1000),
        }),
        LoginAttempt.createFailure({
          uid: `${mockUid}-2`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 2000),
        }),
        LoginAttempt.createSuccess({
          uid: `${mockUid}-3`,
          userId: mockUserId,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 3000),
        }),
        LoginAttempt.createFailure({
          uid: `${mockUid}-4`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 4000),
        }),
        LoginAttempt.createFailure({
          uid: `${mockUid}-5`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 5000),
        }),
      ];

      expect(policy.isAccountLocked(attempts)).toBe(false);
    });

    it('최근 5번이 모두 실패하지만 그 이전에 성공이 있어도 잠긴다', () => {
      const attempts = [
        LoginAttempt.createFailure({
          uid: `${mockUid}-1`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 1000),
        }),
        LoginAttempt.createFailure({
          uid: `${mockUid}-2`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 2000),
        }),
        LoginAttempt.createFailure({
          uid: `${mockUid}-3`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 3000),
        }),
        LoginAttempt.createFailure({
          uid: `${mockUid}-4`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 4000),
        }),
        LoginAttempt.createFailure({
          uid: `${mockUid}-5`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 5000),
        }),
        // 6번째 시도는 성공이지만, 최근 5번만 확인하므로 잠김
        LoginAttempt.createSuccess({
          uid: `${mockUid}-6`,
          userId: mockUserId,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 6000),
        }),
      ];

      expect(policy.isAccountLocked(attempts)).toBe(true);
    });

    it('최근 5번 중 첫 번째가 성공하면 잠기지 않는다', () => {
      const attempts = [
        LoginAttempt.createSuccess({
          uid: `${mockUid}-1`,
          userId: mockUserId,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 1000),
        }),
        LoginAttempt.createFailure({
          uid: `${mockUid}-2`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 2000),
        }),
        LoginAttempt.createFailure({
          uid: `${mockUid}-3`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 3000),
        }),
        LoginAttempt.createFailure({
          uid: `${mockUid}-4`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 4000),
        }),
        LoginAttempt.createFailure({
          uid: `${mockUid}-5`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 5000),
        }),
      ];

      expect(policy.isAccountLocked(attempts)).toBe(false);
    });

    it('빈 배열이면 잠기지 않는다', () => {
      expect(policy.isAccountLocked([])).toBe(false);
    });

    it('최근 6번이 모두 실패해도 잠긴다', () => {
      const attempts = [
        LoginAttempt.createFailure({
          uid: `${mockUid}-1`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 1000),
        }),
        LoginAttempt.createFailure({
          uid: `${mockUid}-2`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 2000),
        }),
        LoginAttempt.createFailure({
          uid: `${mockUid}-3`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 3000),
        }),
        LoginAttempt.createFailure({
          uid: `${mockUid}-4`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 4000),
        }),
        LoginAttempt.createFailure({
          uid: `${mockUid}-5`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 5000),
        }),
        LoginAttempt.createFailure({
          uid: `${mockUid}-6`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: new Date(baseDate.getTime() - 6000),
        }),
      ];

      expect(policy.isAccountLocked(attempts)).toBe(true);
    });
  });
});
