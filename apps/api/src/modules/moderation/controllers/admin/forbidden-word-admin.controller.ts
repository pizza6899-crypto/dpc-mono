import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  ApiPaginatedResponse,
  ApiStandardResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain/log-payload.type';
import { FindForbiddenWordsAdminService } from '../../application/admin/find-forbidden-words-admin.service';
import { CreateForbiddenWordAdminService } from '../../application/admin/create-forbidden-word-admin.service';
import { UpdateForbiddenWordAdminService } from '../../application/admin/update-forbidden-word-admin.service';
import { DeleteForbiddenWordAdminService } from '../../application/admin/delete-forbidden-word-admin.service';
import { FindForbiddenWordsAdminQueryDto } from './dto/request/find-forbidden-words-admin.query.dto';
import { CreateForbiddenWordAdminDto } from './dto/request/create-forbidden-word-admin.dto';
import { UpdateForbiddenWordAdminDto } from './dto/request/update-forbidden-word-admin.dto';
import { ForbiddenWordAdminResponseDto } from './dto/response/forbidden-word-admin.response.dto';

@ApiTags('Admin Moderation')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN) // 관리자 권한 필수
@Controller('admin/forbidden-words')
export class ForbiddenWordAdminController {
  constructor(
    private readonly findService: FindForbiddenWordsAdminService,
    private readonly createService: CreateForbiddenWordAdminService,
    private readonly updateService: UpdateForbiddenWordAdminService,
    private readonly deleteService: DeleteForbiddenWordAdminService,
  ) {}

  @Get()
  @Paginated()
  @ApiOperation({ summary: 'Find Forbidden Words / 금지어 목록 조회' })
  @ApiPaginatedResponse(ForbiddenWordAdminResponseDto)
  async findMany(
    @Query() query: FindForbiddenWordsAdminQueryDto,
  ): Promise<PaginatedData<ForbiddenWordAdminResponseDto>> {
    const result = await this.findService.execute({
      ...query,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });

    return {
      ...result,
      data: result.data.map((word) => ({
        id: word.id.toString(),
        word: word.word,
        description: word.description,
        isActive: word.isActive,
        createdAt: word.createdAt,
        updatedAt: word.updatedAt,
      })),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create Forbidden Word / 금지어 생성' })
  @ApiStandardResponse()
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'MODERATION',
    action: 'CREATE_FORBIDDEN_WORD',
    extractMetadata: (req) => ({ word: req.body.word }),
  })
  async create(@Body() dto: CreateForbiddenWordAdminDto): Promise<void> {
    await this.createService.execute(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Forbidden Word / 금지어 수정' })
  @ApiParam({ name: 'id', description: 'Forbidden Word ID' })
  @ApiStandardResponse()
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'MODERATION',
    action: 'UPDATE_FORBIDDEN_WORD',
    extractMetadata: (req) => ({ id: req.params.id }),
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateForbiddenWordAdminDto,
  ): Promise<void> {
    await this.updateService.execute({ id: BigInt(id), ...dto });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Forbidden Word / 금지어 삭제' })
  @ApiParam({ name: 'id', description: 'Forbidden Word ID' })
  @ApiStandardResponse()
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'MODERATION',
    action: 'DELETE_FORBIDDEN_WORD',
    extractMetadata: (req) => ({ id: req.params.id }),
  })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteService.execute(BigInt(id));
  }
}
