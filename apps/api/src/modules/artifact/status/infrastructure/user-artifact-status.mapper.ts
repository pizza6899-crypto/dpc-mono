import { Injectable } from '@nestjs/common';
import { UserArtifactStatus as PrismaUserArtifactStatus, ArtifactGrade } from '@prisma/client';
import { UserArtifactStatus } from '../domain/user-artifact-status.entity';

@Injectable()
export class UserArtifactStatusMapper {
  /**
   * Prisma 레코드를 도메인 엔티티로 변환
   */
  toEntity(record: PrismaUserArtifactStatus | any): UserArtifactStatus {
    return UserArtifactStatus.rehydrate({
      userId: record.userId,
      activeSlotCount: record.activeSlotCount,
      totalDrawCount: record.totalDrawCount,
      totalTicketDrawCount: record.totalTicketDrawCount,
      totalCurrencyDrawCount: record.totalCurrencyDrawCount,
      totalSynthesisCount: record.totalSynthesisCount,
      ticketAllCount: record.ticketAllCount,
      ticketCommonCount: record.ticketCommonCount,
      ticketUncommonCount: record.ticketUncommonCount,
      ticketRareCount: record.ticketRareCount,
      ticketEpicCount: record.ticketEpicCount,
      ticketLegendaryCount: record.ticketLegendaryCount,
      ticketMythicCount: record.ticketMythicCount,
      ticketUniqueCount: record.ticketUniqueCount,
      drawCountTicketAll: record.drawCountTicketAll,
      drawCountTicketCommon: record.drawCountTicketCommon,
      drawCountTicketUncommon: record.drawCountTicketUncommon,
      drawCountTicketRare: record.drawCountTicketRare,
      drawCountTicketEpic: record.drawCountTicketEpic,
      drawCountTicketLegendary: record.drawCountTicketLegendary,
      drawCountTicketMythic: record.drawCountTicketMythic,
      drawCountTicketUnique: record.drawCountTicketUnique,
      synthesisCommonSuccessCount: record.synthesisCommonSuccessCount,
      synthesisCommonFailCount: record.synthesisCommonFailCount,
      synthesisCommonPityCount: record.synthesisCommonPityCount,
      synthesisUncommonSuccessCount: record.synthesisUncommonSuccessCount,
      synthesisUncommonFailCount: record.synthesisUncommonFailCount,
      synthesisUncommonPityCount: record.synthesisUncommonPityCount,
      synthesisRareSuccessCount: record.synthesisRareSuccessCount,
      synthesisRareFailCount: record.synthesisRareFailCount,
      synthesisRarePityCount: record.synthesisRarePityCount,
      synthesisEpicSuccessCount: record.synthesisEpicSuccessCount,
      synthesisEpicFailCount: record.synthesisEpicFailCount,
      synthesisEpicPityCount: record.synthesisEpicPityCount,
      synthesisLegendarySuccessCount: record.synthesisLegendarySuccessCount,
      synthesisLegendaryFailCount: record.synthesisLegendaryFailCount,
      synthesisLegendaryPityCount: record.synthesisLegendaryPityCount,
      synthesisMythicSuccessCount: record.synthesisMythicSuccessCount,
      synthesisMythicFailCount: record.synthesisMythicFailCount,
      synthesisMythicPityCount: record.synthesisMythicPityCount,
      synthesisUniqueSuccessCount: record.synthesisUniqueSuccessCount,
      synthesisUniqueFailCount: record.synthesisUniqueFailCount,
      synthesisUniquePityCount: record.synthesisUniquePityCount,
      updatedAt: record.updatedAt,
    });
  }

  /**
   * 도메인 엔티티를 Persistence 데이터로 변환 (ID 불변)
   */
  toPersistence(entity: UserArtifactStatus): any {
    return {
      userId: entity.userId,
      activeSlotCount: entity.activeSlotCount,
      totalDrawCount: entity.totalDrawCount,
      totalTicketDrawCount: entity.totalTicketDrawCount,
      totalCurrencyDrawCount: entity.totalCurrencyDrawCount,
      totalSynthesisCount: entity.totalSynthesisCount,
      ticketAllCount: entity.ticketAllCount,
      ticketCommonCount: entity.getGradeTicketCount(ArtifactGrade.COMMON),
      ticketUncommonCount: entity.getGradeTicketCount(ArtifactGrade.UNCOMMON),
      ticketRareCount: entity.getGradeTicketCount(ArtifactGrade.RARE),
      ticketEpicCount: entity.getGradeTicketCount(ArtifactGrade.EPIC),
      ticketLegendaryCount: entity.getGradeTicketCount(ArtifactGrade.LEGENDARY),
      ticketMythicCount: entity.getGradeTicketCount(ArtifactGrade.MYTHIC),
      ticketUniqueCount: entity.getGradeTicketCount(ArtifactGrade.UNIQUE),
      drawCountTicketAll: entity.getGradeTicketDrawCount('ALL'),
      drawCountTicketCommon: entity.getGradeTicketDrawCount(ArtifactGrade.COMMON),
      drawCountTicketUncommon: entity.getGradeTicketDrawCount(ArtifactGrade.UNCOMMON),
      drawCountTicketRare: entity.getGradeTicketDrawCount(ArtifactGrade.RARE),
      drawCountTicketEpic: entity.getGradeTicketDrawCount(ArtifactGrade.EPIC),
      drawCountTicketLegendary: entity.getGradeTicketDrawCount(ArtifactGrade.LEGENDARY),
      drawCountTicketMythic: entity.getGradeTicketDrawCount(ArtifactGrade.MYTHIC),
      drawCountTicketUnique: entity.getGradeTicketDrawCount(ArtifactGrade.UNIQUE),
      synthesisCommonSuccessCount: entity.getSynthesisSuccessCount(ArtifactGrade.COMMON),
      synthesisCommonFailCount: entity.getSynthesisFailCount(ArtifactGrade.COMMON),
      synthesisCommonPityCount: entity.getSynthesisPityCount(ArtifactGrade.COMMON),
      synthesisUncommonSuccessCount: entity.getSynthesisSuccessCount(ArtifactGrade.UNCOMMON),
      synthesisUncommonFailCount: entity.getSynthesisFailCount(ArtifactGrade.UNCOMMON),
      synthesisUncommonPityCount: entity.getSynthesisPityCount(ArtifactGrade.UNCOMMON),
      synthesisRareSuccessCount: entity.getSynthesisSuccessCount(ArtifactGrade.RARE),
      synthesisRareFailCount: entity.getSynthesisFailCount(ArtifactGrade.RARE),
      synthesisRarePityCount: entity.getSynthesisPityCount(ArtifactGrade.RARE),
      synthesisEpicSuccessCount: entity.getSynthesisSuccessCount(ArtifactGrade.EPIC),
      synthesisEpicFailCount: entity.getSynthesisFailCount(ArtifactGrade.EPIC),
      synthesisEpicPityCount: entity.getSynthesisPityCount(ArtifactGrade.EPIC),
      synthesisLegendarySuccessCount: entity.getSynthesisSuccessCount(ArtifactGrade.LEGENDARY),
      synthesisLegendaryFailCount: entity.getSynthesisFailCount(ArtifactGrade.LEGENDARY),
      synthesisLegendaryPityCount: entity.getSynthesisPityCount(ArtifactGrade.LEGENDARY),
      synthesisMythicSuccessCount: entity.getSynthesisSuccessCount(ArtifactGrade.MYTHIC),
      synthesisMythicFailCount: entity.getSynthesisFailCount(ArtifactGrade.MYTHIC),
      synthesisMythicPityCount: entity.getSynthesisPityCount(ArtifactGrade.MYTHIC),
      synthesisUniqueSuccessCount: entity.getSynthesisSuccessCount(ArtifactGrade.UNIQUE),
      synthesisUniqueFailCount: entity.getSynthesisFailCount(ArtifactGrade.UNIQUE),
      synthesisUniquePityCount: entity.getSynthesisPityCount(ArtifactGrade.UNIQUE),
      updatedAt: entity.updatedAt,
    };
  }
}
