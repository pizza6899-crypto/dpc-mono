import { ApiProperty } from '@nestjs/swagger';
import { GamingCurrencyCode } from 'src/utils/currency.util';

export class SimulateRoundRequestDto {
    @ApiProperty({ description: '테스트할 사용자 ID', example: '1000' })
    userId: string;

    @ApiProperty({ description: '게임 ID (실제 DB에 존재하는 ID여야 함)', example: 1 })
    gameId: number;

    @ApiProperty({ description: '베팅 금액', example: 1000 })
    betAmount: number;

    @ApiProperty({ description: '당첨 금액 (0이면 낙첨)', example: 0 })
    winAmount: number;

    @ApiProperty({ description: '통화 코드', example: 'KRW', required: false })
    currency: string = 'KRW';

    @ApiProperty({ description: '게임 제공사 (Whitecliff용)', example: 'RELAX_GAMING', required: false })
    providerCode?: string;
}

export class SimulateRoundResponseDto {
    @ApiProperty({ description: '성공 여부' })
    success: boolean;

    @ApiProperty({ description: '생성된 라운드 ID' })
    roundId: string;

    @ApiProperty({ description: '최종 잔액' })
    finalBalance: number;

    @ApiProperty({ description: '실행 로그' })
    logs: string[];
}
