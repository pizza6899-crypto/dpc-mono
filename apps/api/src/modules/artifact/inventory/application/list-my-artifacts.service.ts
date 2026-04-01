import { Injectable } from '@nestjs/common';
import { UserArtifactRepositoryPort } from '../ports/user-artifact.repository.port';
import { GetMyArtifactsQueryDto } from '../controllers/user/dto/request/get-my-artifacts.query.dto';
import { UserArtifactResponseDto } from '../controllers/user/dto/response/user-artifact.response.dto';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import { SqidsService } from 'src/infrastructure/sqids/sqids.service';
import { SqidsPrefix } from 'src/infrastructure/sqids/sqids.constants';

/**
 * [Artifact Inventory] 보유 유물 목록 조회 서비스
 */
@Injectable()
export class ListMyArtifactsService {
  constructor(
    private readonly repository: UserArtifactRepositoryPort,
    private readonly sqidsService: SqidsService,
  ) { }

  /**
   * 유저별 보유 유물을 페이지네이션으로 조회하여 반환
   */
  async execute(userId: bigint, query: GetMyArtifactsQueryDto): Promise<PaginatedData<UserArtifactResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [entities, total] = await this.repository.findManyByUserId(userId, {
      skip,
      take: limit,
      grades: query.grades,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    const data: UserArtifactResponseDto[] = entities.map((entity) => ({
      id: this.sqidsService.encode(entity.id, SqidsPrefix.USER_ARTIFACT),
      artifactCode: entity.catalog?.code || 'UNKNOWN',
      slotNo: entity.slotNo ?? undefined,
      isEquipped: entity.isEquipped,
      grade: entity.catalog?.grade,
      acquiredAt: entity.createdAt,
    }));

    return {
      data,
      total,
      page,
      limit,
    };
  }
}
