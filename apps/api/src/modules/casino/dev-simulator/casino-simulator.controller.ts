import { Body, Controller, Post, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CasinoSimulatorService } from './casino-simulator.service';
import { SimulateRoundRequestDto } from './dto/simulate-round.dto';
import { Public } from 'src/common/auth/decorators/roles.decorator';

@ApiTags('Public Casino Simulator')
@Controller('casino/dev/simulate')
@Public() // 개발용이므로 Public (보안 주의)
export class CasinoSimulatorController {
    constructor(private readonly simulatorService: CasinoSimulatorService) { }

    @Post('round')
    @ApiOperation({ summary: '게임 라운드 전체 시뮬레이션 (Bet -> Win -> PostProcess)' })
    async simulateRound(@Body() dto: SimulateRoundRequestDto) {
        // [Safety] 프로덕션 환경에서는 동작하지 않음
        if (process.env.NODE_ENV === 'production') {
            throw new NotFoundException();
        }
        return this.simulatorService.simulateRound(dto);
    }
}
