import { ArtifactGrade } from '@prisma/client';
import { InsufficientArtifactTicketsException } from './status.exception';

/**
 * [Artifact] 유저별 유물 시스템 상태 정보 (인벤토리 슬롯 및 통계) 엔티티
 */
export class UserArtifactStatus {
  private constructor(
    private readonly _userId: bigint,
    private _activeSlotCount: number,
    private _totalDrawCount: number,
    private _totalTicketDrawCount: number,
    private _totalCurrencyDrawCount: number,
    private _totalSynthesisCount: number,
    private _ticketAllCount: number,
    private _gradeTickets: Record<ArtifactGrade, number>,
    private _drawCountTickets: Record<ArtifactGrade | 'ALL', number>,
    private _synthesisSuccessCounts: Record<ArtifactGrade, number>,
    private _synthesisFailCounts: Record<ArtifactGrade, number>,
    private _synthesisPityCounts: Record<ArtifactGrade, number>, // 신규: 천장용 스택 (성공 시 리셋)
    private _updatedAt: Date,
  ) { }

  /**
   * DB 데이터를 엔티티 객체로 복원
   */
  static rehydrate(data: {
    userId: bigint;
    activeSlotCount: number;
    totalDrawCount: number;
    totalTicketDrawCount: number;
    totalCurrencyDrawCount: number;
    totalSynthesisCount: number;
    ticketAllCount: number;
    ticketCommonCount: number;
    ticketUncommonCount: number;
    ticketRareCount: number;
    ticketEpicCount: number;
    ticketLegendaryCount: number;
    ticketMythicCount: number;
    ticketUniqueCount: number;
    drawCountTicketAll: number;
    drawCountTicketCommon: number;
    drawCountTicketUncommon: number;
    drawCountTicketRare: number;
    drawCountTicketEpic: number;
    drawCountTicketLegendary: number;
    drawCountTicketMythic: number;
    drawCountTicketUnique: number;
    synthesisCommonSuccessCount: number;
    synthesisCommonFailCount: number;
    synthesisCommonPityCount: number;
    synthesisUncommonSuccessCount: number;
    synthesisUncommonFailCount: number;
    synthesisUncommonPityCount: number;
    synthesisRareSuccessCount: number;
    synthesisRareFailCount: number;
    synthesisRarePityCount: number;
    synthesisEpicSuccessCount: number;
    synthesisEpicFailCount: number;
    synthesisEpicPityCount: number;
    synthesisLegendarySuccessCount: number;
    synthesisLegendaryFailCount: number;
    synthesisLegendaryPityCount: number;
    synthesisMythicSuccessCount: number;
    synthesisMythicFailCount: number;
    synthesisMythicPityCount: number;
    synthesisUniqueSuccessCount: number;
    synthesisUniqueFailCount: number;
    synthesisUniquePityCount: number;
    updatedAt: Date;
  }): UserArtifactStatus {
    return new UserArtifactStatus(
      data.userId,
      data.activeSlotCount,
      data.totalDrawCount,
      data.totalTicketDrawCount,
      data.totalCurrencyDrawCount,
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
      {
        ALL: data.drawCountTicketAll,
        [ArtifactGrade.COMMON]: data.drawCountTicketCommon,
        [ArtifactGrade.UNCOMMON]: data.drawCountTicketUncommon,
        [ArtifactGrade.RARE]: data.drawCountTicketRare,
        [ArtifactGrade.EPIC]: data.drawCountTicketEpic,
        [ArtifactGrade.LEGENDARY]: data.drawCountTicketLegendary,
        [ArtifactGrade.MYTHIC]: data.drawCountTicketMythic,
        [ArtifactGrade.UNIQUE]: data.drawCountTicketUnique,
      },
      {
        [ArtifactGrade.COMMON]: data.synthesisCommonSuccessCount,
        [ArtifactGrade.UNCOMMON]: data.synthesisUncommonSuccessCount,
        [ArtifactGrade.RARE]: data.synthesisRareSuccessCount,
        [ArtifactGrade.EPIC]: data.synthesisEpicSuccessCount,
        [ArtifactGrade.LEGENDARY]: data.synthesisLegendarySuccessCount,
        [ArtifactGrade.MYTHIC]: data.synthesisMythicSuccessCount,
        [ArtifactGrade.UNIQUE]: data.synthesisUniqueSuccessCount,
      },
      {
        [ArtifactGrade.COMMON]: data.synthesisCommonFailCount,
        [ArtifactGrade.UNCOMMON]: data.synthesisUncommonFailCount,
        [ArtifactGrade.RARE]: data.synthesisRareFailCount,
        [ArtifactGrade.EPIC]: data.synthesisEpicFailCount,
        [ArtifactGrade.LEGENDARY]: data.synthesisLegendaryFailCount,
        [ArtifactGrade.MYTHIC]: data.synthesisMythicFailCount,
        [ArtifactGrade.UNIQUE]: data.synthesisUniqueFailCount,
      },
      {
        [ArtifactGrade.COMMON]: data.synthesisCommonPityCount,
        [ArtifactGrade.UNCOMMON]: data.synthesisUncommonPityCount,
        [ArtifactGrade.RARE]: data.synthesisRarePityCount,
        [ArtifactGrade.EPIC]: data.synthesisEpicPityCount,
        [ArtifactGrade.LEGENDARY]: data.synthesisLegendaryPityCount,
        [ArtifactGrade.MYTHIC]: data.synthesisMythicPityCount,
        [ArtifactGrade.UNIQUE]: data.synthesisUniquePityCount,
      },
      data.updatedAt,
    );
  }

  /**
   * 신규 유저를 위한 초기 상태 생성
   */
  static create(userId: bigint): UserArtifactStatus {
    const defaultGradeMap = {
      [ArtifactGrade.COMMON]: 0,
      [ArtifactGrade.UNCOMMON]: 0,
      [ArtifactGrade.RARE]: 0,
      [ArtifactGrade.EPIC]: 0,
      [ArtifactGrade.LEGENDARY]: 0,
      [ArtifactGrade.MYTHIC]: 0,
      [ArtifactGrade.UNIQUE]: 0,
    };

    return new UserArtifactStatus(
      userId,
      0,
      0,
      0,
      0,
      0,
      0,
      { ...defaultGradeMap },
      { ALL: 0, ...defaultGradeMap },
      { ...defaultGradeMap },
      { ...defaultGradeMap },
      { ...defaultGradeMap },
      new Date(),
    );
  }

  /**
   * 티켓 차감 및 통계 증가 (뽑기 시 사용)
   */
  spendTickets(type: 'ALL' | ArtifactGrade, count: number): void {
    if (type === 'ALL') {
      if (this._ticketAllCount < count) {
        throw new InsufficientArtifactTicketsException(`Not enough common tickets. Available: ${this._ticketAllCount}, Required: ${count}`);
      }
      this._ticketAllCount -= count;
      this._drawCountTickets.ALL += count;
    } else {
      if (this._gradeTickets[type] < count) {
        throw new InsufficientArtifactTicketsException(`Not enough ${type} grade tickets. Available: ${this._gradeTickets[type]}, Required: ${count}`);
      }
      this._gradeTickets[type] -= count;
      this._drawCountTickets[type] += count;
    }

    this._totalTicketDrawCount += count;
    this._totalDrawCount += count;
    this._updatedAt = new Date();
  }

  /**
   * 재화 사용 뽑기 시 통계 증가
   */
  recordCurrencyDraw(count: number): void {
    this._totalCurrencyDrawCount += count;
    this._totalDrawCount += count;
    this._updatedAt = new Date();
  }

  /**
   * [Synthesis] 합성 성공 기록
   */
  recordSynthesisSuccess(grade: ArtifactGrade): void {
    this._synthesisSuccessCounts[grade] += 1;
    this._totalSynthesisCount += 1;
    this._updatedAt = new Date();
  }

  /**
   * [Synthesis] 합성 실패 기록
   */
  recordSynthesisFail(grade: ArtifactGrade): void {
    this._synthesisFailCounts[grade] += 1; // 평생 누적 실패 (리셋 안됨)
    this._synthesisPityCounts[grade] += 1; // 천장용 스택 증가
    this._totalSynthesisCount += 1;
    this._updatedAt = new Date();
  }

  /**
   * [Synthesis] 특정 등급의 천장 스택 리셋
   */
  resetSynthesisPityCount(grade: ArtifactGrade): void {
    this._synthesisPityCounts[grade] = 0;
    this._updatedAt = new Date();
  }

  /**
   * 활성화된(해금된) 슬롯 개수 업데이트
   */
  updateActiveSlotCount(count: number): void {
    if (count < 0) return;
    this._activeSlotCount = count;
    this._updatedAt = new Date();
  }

  // --- Getters ---
  get userId(): bigint { return this._userId; }
  get activeSlotCount(): number { return this._activeSlotCount; }
  get totalDrawCount(): number { return this._totalDrawCount; }
  get totalTicketDrawCount(): number { return this._totalTicketDrawCount; }
  get totalCurrencyDrawCount(): number { return this._totalCurrencyDrawCount; }
  get totalSynthesisCount(): number { return this._totalSynthesisCount; }
  get ticketAllCount(): number { return this._ticketAllCount; }
  getGradeTicketCount(grade: ArtifactGrade): number { return this._gradeTickets[grade]; }
  getGradeTicketDrawCount(grade: ArtifactGrade | 'ALL'): number { return this._drawCountTickets[grade]; }
  getSynthesisSuccessCount(grade: ArtifactGrade): number { return this._synthesisSuccessCounts[grade]; }
  getSynthesisFailCount(grade: ArtifactGrade): number { return this._synthesisFailCounts[grade]; }
  getSynthesisPityCount(grade: ArtifactGrade): number { return this._synthesisPityCounts[grade]; }

  /**
   * 보유 티켓 통합 정보 반환
   */
  get tickets() {
    return {
      all: this._ticketAllCount,
      ...this._gradeTickets,
    };
  }

  get updatedAt(): Date { return this._updatedAt; }
}
