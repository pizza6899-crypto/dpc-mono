import { Injectable } from '@nestjs/common';
import { ArtifactGrade, ExchangeCurrencyCode } from '@prisma/client';
import { DrawResultResponseDto } from '../controllers/user/dto/response/draw-result.response.dto';

export interface DrawArtifactCommand {
  userId: bigint;
  type: 'SINGLE' | 'TEN';
  paymentType: 'CURRENCY' | 'TICKET';
  ticketType?: 'ALL' | ArtifactGrade;
  currency: ExchangeCurrencyCode;
}

/**
 * [Artifact Draw] 유물 뽑기 실행 서비스 (Mock)
 */
@Injectable()
export class DrawArtifactService {
  async execute(command: DrawArtifactCommand): Promise<DrawResultResponseDto> {
    const { type } = command;
    const count = type === 'SINGLE' ? 1 : 11; // 10+1 정책 적용

    console.log(`Executing ${type} draw for user ${command.userId}`);

    // Mock Response
    return {
      items: Array.from({ length: count }, (_, i) => ({
        id: `mock_sqid_${i}`,
        artifactId: '101',
        grade: ArtifactGrade.COMMON,
      })),
    };
  }
}
