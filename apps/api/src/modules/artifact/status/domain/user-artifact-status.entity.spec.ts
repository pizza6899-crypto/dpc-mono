import { UserArtifactStatus } from './user-artifact-status.entity';
import { ArtifactGrade } from '@prisma/client';
import { InsufficientArtifactTicketsException } from './status.exception';

function makeRehydrateData(): any {
  const now = new Date();
  return {
    userId: 1n,
    activeSlotCount: 0,
    totalDrawCount: 0,
    totalTicketDrawCount: 0,
    totalCurrencyDrawCount: 0,
    totalSynthesisCount: 0,
    ticketAllCount: 5,
    ticketCommonCount: 2,
    ticketUncommonCount: 0,
    ticketRareCount: 0,
    ticketEpicCount: 0,
    ticketLegendaryCount: 0,
    ticketMythicCount: 0,
    ticketUniqueCount: 0,
    drawCountTicketAll: 0,
    drawCountTicketCommon: 0,
    drawCountTicketUncommon: 0,
    drawCountTicketRare: 0,
    drawCountTicketEpic: 0,
    drawCountTicketLegendary: 0,
    drawCountTicketMythic: 0,
    drawCountTicketUnique: 0,
    synthesisCommonSuccessCount: 0,
    synthesisCommonFailCount: 0,
    synthesisCommonPityCount: 0,
    synthesisUncommonSuccessCount: 0,
    synthesisUncommonFailCount: 0,
    synthesisUncommonPityCount: 0,
    synthesisRareSuccessCount: 0,
    synthesisRareFailCount: 0,
    synthesisRarePityCount: 0,
    synthesisEpicSuccessCount: 0,
    synthesisEpicFailCount: 0,
    synthesisEpicPityCount: 0,
    synthesisLegendarySuccessCount: 0,
    synthesisLegendaryFailCount: 0,
    synthesisLegendaryPityCount: 0,
    synthesisMythicSuccessCount: 0,
    synthesisMythicFailCount: 0,
    synthesisMythicPityCount: 0,
    synthesisUniqueSuccessCount: 0,
    synthesisUniqueFailCount: 0,
    synthesisUniquePityCount: 0,
    updatedAt: now,
  };
}

describe('UserArtifactStatus', () => {
  it('create default zeros', () => {
    const s = UserArtifactStatus.create(1n);
    expect(s.userId).toBe(1n);
    expect(s.activeSlotCount).toBe(0);
    expect(s.ticketAllCount).toBe(0);
  });

  it('spendTickets throws when insufficient', () => {
    const s = UserArtifactStatus.create(1n);
    expect(() => s.spendTickets('ALL', 1)).toThrow(InsufficientArtifactTicketsException);
  });

  it('spendTickets decreases counts and updates stats', () => {
    const data = makeRehydrateData();
    const s = UserArtifactStatus.rehydrate(data);
    s.spendTickets('ALL', 3);
    expect(s.ticketAllCount).toBe(2);
    expect(s.getGradeTicketDrawCount('ALL')).toBe(3);
    expect(s.totalTicketDrawCount).toBe(3);
    expect(s.totalDrawCount).toBe(3);
  });

  it('recordCurrencyDraw and synthesis fail/success/pity/reset', () => {
    const data = makeRehydrateData();
    const s = UserArtifactStatus.rehydrate(data);
    s.recordCurrencyDraw(2);
    expect(s.totalCurrencyDrawCount).toBe(2);
    expect(s.totalDrawCount).toBe(2);

    s.recordSynthesisFail(ArtifactGrade.COMMON);
    expect(s.getSynthesisFailCount(ArtifactGrade.COMMON)).toBe(1);
    expect(s.getSynthesisPityCount(ArtifactGrade.COMMON)).toBe(1);
    expect(s.totalSynthesisCount).toBe(1);

    s.resetSynthesisPityCount(ArtifactGrade.COMMON);
    expect(s.getSynthesisPityCount(ArtifactGrade.COMMON)).toBe(0);

    s.recordSynthesisSuccess(ArtifactGrade.COMMON);
    expect(s.getSynthesisSuccessCount(ArtifactGrade.COMMON)).toBe(1);
    expect(s.totalSynthesisCount).toBe(2);
  });

  it('updateActiveSlotCount ignores negative and updates positive', () => {
    const s = UserArtifactStatus.create(1n);
    s.updateActiveSlotCount(-1);
    expect(s.activeSlotCount).toBe(0);
    s.updateActiveSlotCount(3);
    expect(s.activeSlotCount).toBe(3);
  });
});
