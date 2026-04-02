import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { FindBannersService } from '../../application/find-banners.service';
import { CreateBannerService } from '../../application/create-banner.service';
import { UpdateBannerService } from '../../application/update-banner.service';
import { DeleteBannerService } from '../../application/delete-banner.service';
import { GetBannerByIdService } from '../../application/get-banner-by-id.service';
import { CreateBannerAdminRequestDto } from './dto/request/create-banner.request.dto';
import { UpdateBannerAdminRequestDto } from './dto/request/update-banner.request.dto';
import { BannerAdminResponseDto } from './dto/response/banner-admin.response.dto';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import {
  ApiPaginatedResponse,
  ApiStandardResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { PaginationQueryDto } from 'src/common/http/types';
import type { Banner } from '../../domain/banner.entity';

@ApiTags('Admin Banners')
@Controller('admin/banners')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class BannerAdminController {
  constructor(
    private readonly findBannersService: FindBannersService,
    private readonly getBannerByIdService: GetBannerByIdService,
    private readonly createBannerService: CreateBannerService,
    private readonly updateBannerService: UpdateBannerService,
    private readonly deleteBannerService: DeleteBannerService,
  ) {}

  @Get()
  @Paginated()
  @ApiOperation({ summary: 'List all banners / 배너 목록 조회 (관리자)' })
  @ApiPaginatedResponse(BannerAdminResponseDto)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'BANNER',
    action: 'BANNER_LIST_ADMIN',
    extractMetadata: (req, args) => ({ query: args[0] }),
  })
  async list(@Query() query: PaginationQueryDto) {
    const result = await this.findBannersService.execute({
      page: query.page,
      limit: query.limit,
      isActive: undefined,
    });

    return {
      data: result.data.map((b) => this.toResponseDto(b)),
      page: result.page,
      limit: result.limit,
      total: result.total,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get banner detail / 배너 상세 조회 (관리자)' })
  @ApiStandardResponse(BannerAdminResponseDto)
  async get(@Param('id') id: string): Promise<BannerAdminResponseDto> {
    const banner = await this.getBannerByIdService.execute(BigInt(id));
    return this.toResponseDto(banner);
  }

  @Post()
  @ApiOperation({ summary: 'Create banner / 배너 생성' })
  @ApiStandardResponse(BannerAdminResponseDto, { status: HttpStatus.CREATED })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'BANNER',
    action: 'BANNER_CREATE_ADMIN',
    extractMetadata: (req, args, result: BannerAdminResponseDto) => ({
      id: result?.id,
    }),
  })
  async create(
    @Body() dto: CreateBannerAdminRequestDto,
  ): Promise<BannerAdminResponseDto> {
    const item = await this.createBannerService.execute({
      name: dto.name,
      isActive: dto.isActive,
      order: dto.order,
      linkUrl: dto.linkUrl,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      translations: dto.translations.map((t) => ({
        language: t.language,
        isActive: t.isActive,
        imageUrl: t.imageUrl ?? null,
        title: t.title ?? null,
        altText: t.altText ?? null,
        linkUrl: t.linkUrl ?? null,
      })),
    });

    return this.toResponseDto(item);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update banner / 배너 수정' })
  @ApiStandardResponse(BannerAdminResponseDto)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'BANNER',
    action: 'BANNER_UPDATE_ADMIN',
    extractMetadata: (req, args, result: BannerAdminResponseDto) => ({
      id: args[0],
    }),
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBannerAdminRequestDto,
  ): Promise<BannerAdminResponseDto> {
    const item = await this.updateBannerService.execute({
      id: BigInt(id),
      name: dto.name,
      isActive: dto.isActive,
      order: dto.order,
      linkUrl: dto.linkUrl,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : undefined,
      translations: dto.translations
        ? dto.translations.map((t) => ({
            language: t.language,
            isActive: t.isActive,
            imageUrl: t.imageUrl ?? null,
            title: t.title ?? null,
            altText: t.altText ?? null,
            linkUrl: t.linkUrl ?? null,
          }))
        : undefined,
    });
    return this.toResponseDto(item);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete banner / 배너 삭제' })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'BANNER',
    action: 'BANNER_DELETE_ADMIN',
    extractMetadata: (req, args) => ({ id: args[0] }),
  })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteBannerService.execute(BigInt(id));
  }

  private toResponseDto(banner: Banner): BannerAdminResponseDto {
    return {
      id: banner.id?.toString() ?? '',
      name: banner.name ?? undefined,
      isActive: banner.isActive,
      order: banner.order,
      linkUrl: banner.linkUrl ?? undefined,
      startDate: banner.startDate?.toISOString() ?? undefined,
      endDate: banner.endDate?.toISOString() ?? undefined,
      deletedAt: banner.deletedAt?.toISOString() ?? undefined,
      translations: banner.translations.map((t) => ({
        language: t.language,
        isActive: t.isActive,
        imageUrl: t.imageUrl ?? undefined,
        title: t.title ?? undefined,
        altText: t.altText ?? undefined,
        linkUrl: t.linkUrl ?? undefined,
      })),
    };
  }
}
