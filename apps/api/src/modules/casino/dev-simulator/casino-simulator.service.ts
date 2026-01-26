import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { Prisma, GameAggregatorType, GameProvider } from '@prisma/client';
import { ProcessCasinoBetService } from '../application/process-casino-bet.service';
import { ProcessCasinoCreditService } from '../application/process-casino-credit.service';
import { FindCasinoGameSessionService } from '../game-session/application/find-casino-game-session.service';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { SimulateRoundRequestDto, SimulateRoundResponseDto } from './dto/simulate-round.dto';
import { CreateCasinoGameSessionService } from '../game-session/application/create-casino-game-session.service';
import { UpdatePushedBetService } from '../application/update-pushed-bet.service';
import { GAME_ROUND_REPOSITORY_TOKEN } from '../ports/out/game-round.repository.token';
import type { GameRoundRepositoryPort } from '../ports/out/game-round.repository.port';

@Injectable()
export class CasinoSimulatorService {
    private readonly logger = new Logger(CasinoSimulatorService.name);

    constructor(
        private readonly processBetService: ProcessCasinoBetService,
        private readonly processCreditService: ProcessCasinoCreditService,
        private readonly findSessionService: FindCasinoGameSessionService,
        private readonly createSessionService: CreateCasinoGameSessionService,
        private readonly snowflakeService: SnowflakeService,
        private readonly updatePushedBetService: UpdatePushedBetService,
        @Inject(GAME_ROUND_REPOSITORY_TOKEN)
        private readonly gameRoundRepository: GameRoundRepositoryPort,
    ) { }

    async simulateRound(dto: SimulateRoundRequestDto): Promise<SimulateRoundResponseDto> {
        const { userId, gameId, betAmount, winAmount, currency, providerCode } = dto;
        const logs: string[] = [];

        logs.push(`[Start] User=${userId}, Game=${gameId}, Bet=${betAmount}, Win=${winAmount}`);

        // 1. 세션 준비 (Prepare Session)
        // 시뮬레이션용이므로 Whitecliff 타입으로 가정하거나 적절히 선택
        const aggregatorType = GameAggregatorType.WHITECLIFF;

        let session = await this.findSessionService.findRecent(BigInt(userId), aggregatorType);

        if (!session || String(session.gameId) !== String(gameId)) {
            logs.push(`[Session] 기존 세션 없거나 게임 변경됨. 새 세션 생성 시도.`);
            // 세션이 없으면 새로 생성 (실제로는 LaunchGame을 타야 하지만 여기선 강제 생성)
            // 주의: 실제 LaunchGame 로직을 안 타므로 일부 검증이 빠질 수 있음.
            // 하지만 Bet/Win 테스트 목적이므로 Session Entity만 있으면 됨.
            try {
                session = await this.createSessionService.execute({
                    userId: BigInt(userId),
                    gameId: BigInt(gameId),
                    aggregatorType,
                    walletCurrency: currency as any, // 테스트용 강제 캐스팅
                    gameCurrency: currency as any,
                    token: `SIM_TOKEN_${Date.now()}`,
                    playerName: `User_${userId}`,
                });
                logs.push(`[Session] 세션 생성 완료: ${session.id}`);
            } catch (e) {
                logs.push(`[Error] 세션 생성 실패: ${e.message}`);
                throw e;
            }
        } else {
            logs.push(`[Session] 기존 세션 사용: ${session.id}`);
        }

        // 2. ID 생성
        const now = new Date();
        const roundId = this.snowflakeService.generate(now).toString();
        const betTxId = this.snowflakeService.generate(now).toString();
        // winTxId는 Bet 이후에 생성 (시간 역전 방지)

        // 3. Bet 실행
        const betTime = now;
        const provider = providerCode ? (providerCode as GameProvider) : GameProvider.PRAGMATIC_PLAY_SLOTS;

        logs.push(`[Bet] 요청 시작: TxId=${betTxId}, Amount=${betAmount}`);
        const betResult = await this.processBetService.execute({
            session,
            amount: new Prisma.Decimal(betAmount),
            transactionId: betTxId,
            roundId: roundId,
            gameId: BigInt(gameId),
            betTime: betTime,
            provider,
            description: 'Simulation Bet',
        });
        logs.push(`[Bet] 완료. 잔액: ${betResult.balance}`);

        // 4. Win 실행
        const winTxId = this.snowflakeService.generate(new Date(now.getTime() + 1)).toString();
        logs.push(`[Win] 요청 시작: TxId=${winTxId}, Amount=${winAmount}`);
        // Win Time은 Bet Time + 1~2초
        const winTime = new Date(betTime.getTime() + 1000);

        const winResult = await this.processCreditService.execute({
            session,
            amount: new Prisma.Decimal(winAmount),
            transactionId: winTxId,
            roundId: roundId,
            gameId: BigInt(gameId),
            winTime: winTime,
            provider,
            isEndRound: true, // 라운드 종료 처리
            isSimulation: true, //Added
            description: 'Simulation Win',
        });
        logs.push(`[Win] 완료. 잔액: ${winResult.balance}`);

        // 5. 시뮬레이션 편의성: 푸시 검증 즉시 완료 처리 (5분 대기 방지)
        try {
            const gameRound = await this.gameRoundRepository.findLatestByExternalId(roundId, aggregatorType);
            if (gameRound) {
                await this.updatePushedBetService.markAsChecked([{
                    id: gameRound.id,
                    startedAt: gameRound.startedAt,
                }]);
                logs.push(`[PostProcess] 푸시 검증 마킹 완료 (5분 대기 스킵)`);
            }
        } catch (e) {
            logs.push(`[Warning] 푸시 검증 마킹 실패: ${e.message}`);
        }

        logs.push(`[PostProcess] 큐에 작업 등록됨 (비동기 실행)`);

        return {
            success: true,
            roundId,
            finalBalance: winResult.balance.toNumber(),
            logs,
        };
    }
}
