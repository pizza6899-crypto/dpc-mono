// src/modules/deposit/domain/model/crypto-config.entity.ts
import type { Prisma } from '@prisma/client';

/**
 * CryptoConfig 도메인 엔티티
 *
 * 암호화폐 입금 설정을 표현하는 도메인 엔티티입니다.
 * - symbol과 network 조합으로 고유하게 관리
 * - 최소 입금 금액, 수수료율, 승인 필요 블록 수 등 설정
 * - 토큰의 경우 contractAddress 저장
 */
export class CryptoConfig {
  private constructor(
    public readonly id: bigint | null,
    public readonly symbol: string,
    public readonly network: string,
    private _isActive: boolean,
    public readonly minDepositAmount: Prisma.Decimal,
    public readonly depositFeeRate: Prisma.Decimal,
    public readonly confirmations: number,
    public readonly contractAddress: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) { }

  /**
   * 새로운 엔티티 생성 (팩토리 메서드)
   */
  static create(params: {
    symbol: string;
    network: string;
    isActive?: boolean;
    minDepositAmount: Prisma.Decimal;
    depositFeeRate: Prisma.Decimal;
    confirmations: number;
    contractAddress?: string | null;
  }): CryptoConfig {
    return new CryptoConfig(
      null, // 새 엔티티는 id 없음
      params.symbol,
      params.network,
      params.isActive ?? true,
      params.minDepositAmount,
      params.depositFeeRate,
      params.confirmations,
      params.contractAddress ?? null,
      new Date(),
      new Date(),
    );
  }

  /**
   * DB에서 조회한 데이터로부터 엔티티 생성
   */
  static fromPersistence(data: {
    id: bigint;
    symbol: string;
    network: string;
    isActive: boolean;
    minDepositAmount: Prisma.Decimal;
    depositFeeRate: Prisma.Decimal;
    confirmations: number;
    contractAddress: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): CryptoConfig {
    return new CryptoConfig(
      data.id,
      data.symbol,
      data.network,
      data.isActive,
      data.minDepositAmount,
      data.depositFeeRate,
      data.confirmations,
      data.contractAddress,
      data.createdAt,
      data.updatedAt,
    );
  }

  /**
   * Domain 엔티티를 Persistence 레이어로 변환
   */
  toPersistence(): {
    id: bigint | null;
    symbol: string;
    network: string;
    isActive: boolean;
    minDepositAmount: Prisma.Decimal;
    depositFeeRate: Prisma.Decimal;
    confirmations: number;
    contractAddress: string | null;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      symbol: this.symbol,
      network: this.network,
      isActive: this._isActive,
      minDepositAmount: this.minDepositAmount,
      depositFeeRate: this.depositFeeRate,
      confirmations: this.confirmations,
      contractAddress: this.contractAddress,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * 엔티티 정보 업데이트
   */
  update(params: {
    symbol?: string;
    network?: string;
    isActive?: boolean;
    minDepositAmount?: Prisma.Decimal;
    depositFeeRate?: Prisma.Decimal;
    confirmations?: number;
    contractAddress?: string | null;
  }): CryptoConfig {
    return new CryptoConfig(
      this.id,
      params.symbol ?? this.symbol,
      params.network ?? this.network,
      params.isActive ?? this._isActive,
      params.minDepositAmount ?? this.minDepositAmount,
      params.depositFeeRate ?? this.depositFeeRate,
      params.confirmations ?? this.confirmations,
      params.contractAddress !== undefined
        ? params.contractAddress
        : this.contractAddress,
      this.createdAt,
      new Date(),
    );
  }

  // 상태 관련 메서드
  get isActive(): boolean {
    return this._isActive;
  }

  /**
   * 활성 상태 전환 (불변 패턴 - 새 인스턴스 반환)
   */
  toggleActive(): CryptoConfig {
    return this.update({ isActive: !this._isActive });
  }

  /**
   * 활성화 (불변 패턴 - 새 인스턴스 반환)
   */
  activate(): CryptoConfig {
    return this.update({ isActive: true });
  }

  /**
   * 비활성화 (불변 패턴 - 새 인스턴스 반환)
   */
  deactivate(): CryptoConfig {
    return this.update({ isActive: false });
  }

  // 검증 메서드
  /**
   * 입금 금액이 최소 금액 이상인지 확인
   */
  isAmountAboveMinimum(amount: Prisma.Decimal): boolean {
    return amount.gte(this.minDepositAmount);
  }

  /**
   * 수수료 계산
   */
  calculateFee(amount: Prisma.Decimal): Prisma.Decimal {
    return amount.mul(this.depositFeeRate);
  }

  /**
   * 수수료를 제외한 실제 입금 금액 계산
   */
  calculateAmountAfterFee(amount: Prisma.Decimal): Prisma.Decimal {
    const fee = this.calculateFee(amount);
    return amount.sub(fee);
  }

  /**
   * 토큰인지 확인 (contractAddress가 있으면 토큰)
   */
  isToken(): boolean {
    return this.contractAddress !== null && this.contractAddress.length > 0;
  }

  /**
   * 네이티브 코인인지 확인 (contractAddress가 없으면 네이티브 코인)
   */
  isNativeCoin(): boolean {
    return !this.isToken();
  }

  /**
   * symbol과 network 조합으로 고유 식별자 생성
   */
  getUniqueKey(): string {
    return `${this.symbol}_${this.network}`;
  }
}
