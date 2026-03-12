import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreateQuestService } from '../application/create-quest.service';
import { CreateQuestDto } from './dto/create-quest.dto';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { SessionAuthGuard } from 'src/common/auth/guards/session-auth.guard';
import { Admin } from 'src/common/auth/decorators/roles.decorator';

@Controller('admin/quests')
@UseGuards(SessionAuthGuard)
@Admin()
export class QuestAdminController {
  constructor(
    private readonly createQuestService: CreateQuestService,
  ) { }

  @Post()
  async createQuest(
    @Body() dto: CreateQuestDto,
    @CurrentUser() admin: User,
  ) {
    const id = await this.createQuestService.execute(dto, admin.id);
    return { id: id.toString() };
  }
}
