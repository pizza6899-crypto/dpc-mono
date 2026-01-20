import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from 'src/common/auth/decorators/roles.decorator';
import {
  ApiStandardErrors,
  ApiStandardResponse,
} from 'src/common/http/decorators/api-response.decorator';
import {
  GameListUpdateResponseDto,
  GameListUpdateStatusDto,
  GameListUpdateRequestDto,
} from '../dtos/game-update.dto';
import { WhitecliffGameRefreshService } from '../../../../../../../application/whitecliff-game-refresh.service';

@Controller('whitecliff/admin')
@ApiTags('Whitecliff Admin')
@ApiStandardErrors()
@Public()
export class WhitecliffAdminController {
  constructor(
    private readonly whitecliffGameRefreshService: WhitecliffGameRefreshService,
  ) {}

  @Post('update-game-list')
  @ApiOperation({
    summary:
      'Manually update Whitecliff game list (화이트클리프 게임 목록 수동 업데이트)',
    description:
      'Manually updates the list of games provided by Whitecliff for a specific language. The process is handled asynchronously and an immediate response is returned. (특정 언어에 대한 화이트클리프 게임 목록을 수동으로 업데이트합니다. 비동기적으로 처리되며 즉시 응답을 반환합니다.)',
  })
  @ApiStandardResponse(GameListUpdateResponseDto, {
    status: 200,
    description: 'Game list update initiated (게임 목록 업데이트 시작)',
  })
  async updateGameList(
    @Body() body: GameListUpdateRequestDto,
  ): Promise<GameListUpdateResponseDto> {
    return this.whitecliffGameRefreshService.updateGameListManually(
      body.language,
    );
  }

  @Get('update-status')
  @ApiOperation({
    summary: 'Get Game List Update Status (게임 목록 업데이트 상태 조회)',
    description:
      'Check the current progress of the game list update. (현재 게임 목록 업데이트의 진행 상황을 조회합니다.)',
  })
  @ApiStandardResponse(GameListUpdateStatusDto, {
    status: 200,
    description: 'Update status retrieved (업데이트 상태 조회 성공)',
  })
  async getUpdateStatus(): Promise<GameListUpdateStatusDto> {
    return this.whitecliffGameRefreshService.getUpdateStatus();
  }
}
