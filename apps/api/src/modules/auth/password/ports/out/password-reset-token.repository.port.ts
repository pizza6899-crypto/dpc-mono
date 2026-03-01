// src/modules/auth/credential/ports/out/password-reset-token.repository.port.ts

export interface PasswordResetTokenData {
  id: number;
  userId: bigint;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PasswordResetTokenRepositoryPort {
  /**
   * 비밀번호 재설정 토큰 생성
   */
  create(params: {
    userId: bigint;
    token: string;
    expiresAt: Date;
  }): Promise<PasswordResetTokenData>;

  /**
   * 토큰으로 조회 (사용되지 않은 토큰만)
   */
  findByToken(token: string): Promise<PasswordResetTokenData | null>;

  /**
   * 토큰 사용 처리
   */
  markAsUsed(tokenId: number): Promise<void>;

  /**
   * 사용자의 기존 미사용 토큰 삭제 (새 토큰 생성 전)
   */
  deleteUnusedByUserId(userId: bigint): Promise<void>;
}
