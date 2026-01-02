// src/modules/deposit/ports/out/deposit-detail.repository.port.ts
import type { DepositDetail } from '../../domain';

/**
 * DepositDetail Repository Port (Outbound Port)
 * 입금 상세 정보 데이터 접근 인터페이스
 */
export interface DepositDetailRepositoryPort {
  /**
   * 입금 상세 ID로 조회
   * @param id - 입금 상세 ID (BigInt)
   * @param include - 포함할 관계 (transaction, BankConfig 등)
   * @returns 입금 상세 엔티티 또는 null
   */
  findById(
    id: bigint,
    include?: {
      transaction?: boolean;
      BankConfig?: boolean;
      CryptoConfig?: boolean;
    },
  ): Promise<DepositDetail | null>;

  /**
   * 입금 상세 ID로 조회 (없으면 예외)
   * @param id - 입금 상세 ID (BigInt)
   * @param include - 포함할 관계
   * @returns 입금 상세 엔티티
   * @throws {DepositNotFoundException} 입금 상세가 없는 경우
   */
  getById(
    id: bigint,
    include?: {
      transaction?: boolean;
      BankConfig?: boolean;
      CryptoConfig?: boolean;
    },
  ): Promise<DepositDetail>;

  /**
   * 입금 상세 정보 업데이트
   * @param deposit - 업데이트할 입금 상세 엔티티
   * @returns 업데이트된 입금 상세 엔티티
   */
  update(deposit: DepositDetail): Promise<DepositDetail>;

  /**
   * Transaction의 userId 조회
   * @param transactionId - Transaction ID
   * @returns userId 또는 null
   */
  getTransactionUserId(transactionId: bigint): Promise<bigint | null>;
}

