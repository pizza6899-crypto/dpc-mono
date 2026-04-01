import { Injectable } from '@nestjs/common';
import { ArtifactGrade, ExchangeCurrencyCode } from '@prisma/client';
import { DrawArtifactByTicketService } from './draw-artifact-by-ticket.service';
import { DrawArtifactByCurrencyService } from './draw-artifact-by-currency.service';

export interface DrawnArtifact {
  userArtifactId: string; // Encoded ID
  artifactCode: string;   // Catalog Code
  grade: ArtifactGrade;
}

export interface DrawArtifactCommand {
  userId: bigint;
  type: 'SINGLE' | 'TEN';
  paymentType: 'CURRENCY' | 'TICKET';
  ticketType: 'ALL' | ArtifactGrade;
  currency: ExchangeCurrencyCode;
}

/**
 * [Artifact Draw] 유물 뽑기 실행 서비스 (Dispatcher)
 * 결제 타입에 따라 티켓 또는 재화 서비스로 라우팅합니다.
 */
@Injectable()
export class DrawArtifactService {
  constructor(
    private readonly ticketDrawService: DrawArtifactByTicketService,
    private readonly currencyDrawService: DrawArtifactByCurrencyService,
  ) { }

  /**
   * [Artifact Draw] 유물 뽑기 실행
   */
  async execute(command: DrawArtifactCommand): Promise<{ items: DrawnArtifact[] }> {
    const { paymentType } = command;

    if (paymentType === 'TICKET') {
      return this.ticketDrawService.execute({
        userId: command.userId,
        type: command.type,
        ticketType: command.ticketType,
      });
    }

    return this.currencyDrawService.execute({
      userId: command.userId,
      type: command.type,
      currency: command.currency,
    });
  }
}
