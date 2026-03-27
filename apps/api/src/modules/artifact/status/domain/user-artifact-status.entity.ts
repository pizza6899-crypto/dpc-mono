import { ArtifactGrade } from '@prisma/client';
import { InsufficientArtifactTicketsException } from './status.exception';

/**
 * [Artifact] 유저별 유물 시스템 상태 정보 (인벤토리 슬롯 및 통계) 엔티티
 */
export class UserArtifactStatus {
  private constructor(
    private readonly _userId: bigint,
    private _activeSlotCount: number,
    private _totalDrawCount: bigint,
    private _totalSynthesisCount: bigint,
    private _ticketAllCount: number,
    private _gradeTickets: Record<ArtifactGrade, number>,
    private _updatedAt: Date,
  ) { }

  /**
   * DB 데이터를 엔티티 객체로 복원
   */
  static rehydrate(data: {
    userId: bigint;
    activeSlotCount: number;
    totalDrawCount: bigint;
    totalSynthesisCount: bigint;
    ticketAllCount: number;
    ticketCommonCount: number;
    ticketUncommonCount: number;
    ticketRareCount: number;
    ticketEpicCount: number;
    ticketLegendaryCount: number;
    ticketMythicCount: number;
    ticketUniqueCount: number;
    updatedAt: Date;
  }): UserArtifactStatus {
    return new UserArtifactStatus(
      data.userId,
      data.activeSlotCount,
      data.totalDrawCount,
      data.totalSynthesisCount,
      data.ticketAllCount,
      {
        [ArtifactGrade.COMMON]: data.ticketCommonCount,
        [ArtifactGrade.UNCOMMON]: data.ticketUncommonCount,
        [ArtifactGrade.RARE]: data.ticketRareCount,
        [ArtifactGrade.EPIC]: data.ticketEpicCount,
        [ArtifactGrade.LEGENDARY]: data.ticketLegendaryCount,
        [ArtifactGrade.MYTHIC]: data.ticketMythicCount,
        [ArtifactGrade.UNIQUE]: data.ticketUniqueCount,
      },
      data.updatedAt,
    );
  }

  /**
   * 신규 유저를 위한 초기 상태 생성
   */
  static create(userId: bigint): UserArtifactStatus {
    return new UserArtifactStatus(
      userId,
      0,
      0n,
      0n,
      0,
      {
        [ArtifactGrade.COMMON]: 0,
        [ArtifactGrade.UNCOMMON]: 0,
        [ArtifactGrade.RARE]: 0,
        [ArtifactGrade.EPIC]: 0,
        [ArtifactGrade.LEGENDARY]: 0,
        [ArtifactGrade.MYTHIC]: 0,
        [ArtifactGrade.UNIQUE]: 0,
      },
      new Date(),
    );
  }

  /**
   * 티켓 차감 실행 (뽑기 시 사용)
   */
  spendTickets(type: 'ALL' | ArtifactGrade, count: number): void {
    if (type === 'ALL') {
      if (this._ticketAllCount < count) {
        throw new InsufficientArtifactTicketsException(`Not enough common tickets. Available: ${this._ticketAllCount}, Required: ${count}`);
      }
      this._ticketAllCount -= count;
    } else {
      if (this._gradeTickets[type] < count) {
        throw new InsufficientArtifactTicketsException(`Not enough ${type} grade tickets. Available: ${this._gradeTickets[type]}, Required: ${count}`);
      }
      this._gradeTickets[type] -= count;
    }
    this._updatedAt = new Date();
  }

  /**
   * 누적 뽑기 횟수 증가
   */
  increaseTotalDrawCount(count: number = 1): void {
    this._totalDrawCount += BigInt(count);
    this._updatedAt = new Date();
  }

  /**
   * 누적 합성 시도 횟수 증가
   */
  increaseTotalSynthesisCount(): void {
    this._totalSynthesisCount += 1n;
    this._updatedAt = new Date();
  }

  /**
   * 활성화된(해금된) 슬롯 개수 업데이트
   */
  updateActiveSlotCount(count: number): void {
    if (count < 1) return;
    this._activeSlotCount = count;
    this._updatedAt = new Date();
  }

  // --- Getters ---
  get userId(): bigint { return this._userId; }
  get activeSlotCount(): number { return this._activeSlotCount; }
  get totalDrawCount(): bigint { return this._totalDrawCount; }
  get totalSynthesisCount(): bigint { return this._totalSynthesisCount; }
  get ticketAllCount(): number { return this._ticketAllCount; }
  getGradeTicketCount(grade: ArtifactGrade): number { return this._gradeTickets[grade]; }
  get updatedAt(): Date { return this._updatedAt; }
}
