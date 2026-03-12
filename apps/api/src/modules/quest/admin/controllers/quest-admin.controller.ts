import { Body, Controller, Param, ParseIntPipe, Post, Patch, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateQuestAdminService } from '../application/create-quest-admin.service';
import { UpdateQuestAdminService } from '../application/update-quest-admin.service';
import { FindQuestsAdminService } from '../application/find-quests-admin.service';
import { CreateQuestAdminDto } from './dto/request/create-quest-admin.dto';
import { UpdateQuestAdminDto } from './dto/request/update-quest-admin.dto';
import { GetQuestsAdminQueryDto } from './dto/request/get-quests-admin-query.dto';
import { QuestAdminResponseDto } from './dto/response/quest-admin-response.dto';
import { CreateQuestAdminResponseDto } from './dto/response/create-quest-admin-response.dto';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';
import { ApiStandardErrors, ApiStandardResponse, ApiPaginatedResponse } from 'src/common/http/decorators/api-response.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { QuestMaster } from '../../core/domain/models';
import { PaginatedData } from 'src/common/http/types';

@Controller('admin/quests')
@ApiTags('Admin Quests')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class QuestAdminController {
  constructor(
    private readonly createQuestService: CreateQuestAdminService,
    private readonly updateQuestService: UpdateQuestAdminService,
    private readonly getQuestsService: FindQuestsAdminService,
  ) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List All Quests / 퀘스트 전체 목록 조회',
    description: 'Retrieves a list of all quests with filtering and pagination. / 필터링 및 페이지네이션을 포함한 전체 퀘스트 목록을 조회합니다.',
  })
  @ApiPaginatedResponse(QuestAdminResponseDto, {
    status: HttpStatus.OK,
    description: 'Successfully retrieved quest list / 퀘스트 목록 조회 성공',
  })
  async findAll(@Query() query: GetQuestsAdminQueryDto): Promise<PaginatedData<QuestAdminResponseDto>> {
    const paginatedQuests = await this.getQuestsService.list(query);
    return {
      ...paginatedQuests,
      data: paginatedQuests.data.map(q => this.mapToResponse(q)),
    };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create Quest / 퀘스트 생성',
    description: 'Creates a new quest with goals, rewards, and translations. / 목표, 보상, 번역 정보를 포함하여 새로운 퀘스트를 생성합니다.',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'QUEST',
    action: 'CREATE_QUEST',
    extractMetadata: (req) => ({ body: req.body }),
  })
  @ApiStandardResponse(CreateQuestAdminResponseDto, {
    status: HttpStatus.OK,
    description: 'Successfully created quest / 퀘스트 생성 성공',
  })
  async createQuest(
    @Body() dto: CreateQuestAdminDto,
    @CurrentUser() admin: User,
  ): Promise<CreateQuestAdminResponseDto> {
    const id = await this.createQuestService.execute(dto, admin.id);
    return { id: id.toString() };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Quest / 퀘스트 수정',
    description: 'Updates an existing quest and its components. / 기존 퀘스트 및 하위 항목들을 수정합니다.',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'QUEST',
    action: 'UPDATE_QUEST',
    extractMetadata: (req) => ({ id: req.params.id, body: req.body }),
  })
  @ApiStandardResponse(Object, {
    status: HttpStatus.OK,
    description: 'Successfully updated quest / 퀘스트 수정 성공',
  })
  async updateQuest(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuestAdminDto,
    @CurrentUser() admin: User,
  ) {
    await this.updateQuestService.execute(BigInt(id), dto, admin.id);
    return { success: true };
  }

  private mapToResponse(quest: QuestMaster): QuestAdminResponseDto {
    return {
      id: quest.id.toString(),
      type: quest.type,
      category: quest.category,
      resetCycle: quest.resetCycle,
      maxAttempts: quest.maxAttempts,
      isActive: quest.isActive,
      parentId: quest.parentId?.toString() ?? null,
      precedingId: quest.precedingId?.toString() ?? null,
      metadata: quest.metadata,
      entryRule: quest.entryRule,
      updatedBy: quest.updatedBy?.toString() ?? null,
      startTime: quest.startTime,
      endTime: quest.endTime,
      createdAt: quest.createdAt,
      updatedAt: quest.updatedAt,
      goals: quest.goals.map((g) => ({
        id: g.id.toString(),
        questMasterId: g.questMasterId.toString(),
        currency: g.currency,
        targetAmount: g.targetAmount ? Number(g.targetAmount) : null,
        targetCount: g.targetCount,
        matchRule: g.matchRule,
      })),
      rewards: quest.rewards.map((r) => ({
        id: r.id.toString(),
        questMasterId: r.questMasterId.toString(),
        type: r.type,
        currency: r.currency,
        value: r.value,
        expireDays: r.expireDays,
        wageringMultiplier: Number(r.wageringMultiplier),
      })),
      translations: quest.translations.map((t) => ({
        id: t.id.toString(),
        questMasterId: t.questMasterId.toString(),
        language: t.language,
        title: t.title,
        description: t.description,
      })),
    };
  }
}
