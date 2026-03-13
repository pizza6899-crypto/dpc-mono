import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { FindQuestsUserService } from '../application/find-quests-user.service';
import { GetQuestsUserQueryDto } from './dto/request/get-quests-user-query.dto';
import { QuestUserResponseDto } from './dto/response/quest-user-response.dto';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { ApiStandardErrors, ApiPaginatedResponse } from 'src/common/http/decorators/api-response.decorator';
import { PaginatedData } from 'src/common/http/types';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';

@ApiTags('User Quest')
@Controller('quests')
@ApiCookieAuth()
@RequireRoles(UserRoleType.USER)
@ApiStandardErrors()
export class QuestUserController {
  constructor(
    private readonly findQuestsService: FindQuestsUserService,
    private readonly sqidsService: SqidsService,
  ) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List Available Quests / 참여 가능 퀘스트 목록 조회',
    description: 'Retrieves a list of active quests with user progress. / 유저의 진행 상태를 포함한 활성 퀘스트 목록을 조회합니다.',
  })
  @ApiPaginatedResponse(QuestUserResponseDto, {
    status: HttpStatus.OK,
    description: 'Successfully retrieved quest list / 퀘스트 목록 조회 성공',
  })
  async findAll(
    @Query() query: GetQuestsUserQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedData<QuestUserResponseDto>> {
    const paginatedQuests = await this.findQuestsService.list(
      user.id,
      query,
      user.language,
      user.playCurrency,
    );

    // ID를 Sqid로 인코딩하여 반환
    return {
      ...paginatedQuests,
      data: paginatedQuests.data.map(q => ({
        ...q,
        id: this.sqidsService.encode(BigInt(q.id), SqidsPrefix.QUEST),
      })),
    };
  }
}
