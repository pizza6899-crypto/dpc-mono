import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import {
  ApiStandardErrors,
  ApiStandardResponse,
  ApiPaginatedResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';

import { CreateCouponAdminService } from '../../application/admin/create-coupon.admin.service';
import { UpdateCouponAdminService } from '../../application/admin/update-coupon.admin.service';
import { UpdateCouponStatusAdminService } from '../../application/admin/update-coupon-status.admin.service';
import { GetCouponDetailAdminService } from '../../application/admin/get-coupon-detail.admin.service';
import { GetCouponListAdminService } from '../../application/admin/get-coupon-list.admin.service';

import { CreateCouponAdminRequestDto } from './dto/request/create-coupon.admin.request.dto';
import { UpdateCouponAdminRequestDto } from './dto/request/update-coupon.admin.request.dto';
import { UpdateCouponStatusAdminRequestDto } from './dto/request/update-coupon-status.admin.request.dto';
import { GetCouponListAdminQueryDto } from './dto/request/get-coupon-list.admin.query.dto';
import { CouponAdminResponseDto } from './dto/response/coupon.admin.response.dto';
import type { Coupon } from '../../domain/coupon.entity';

@ApiTags('Admin Coupon Management')
@Controller('admin/coupons')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class AdminCouponController {
  constructor(
    private readonly createCouponService: CreateCouponAdminService,
    private readonly updateCouponService: UpdateCouponAdminService,
    private readonly updateCouponStatusService: UpdateCouponStatusAdminService,
    private readonly getCouponDetailService: GetCouponDetailAdminService,
    private readonly getCouponListService: GetCouponListAdminService,
  ) { }

  /**
   * 쿠폰 생성
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create Coupon / 쿠폰 생성',
    description: 'Creates a new coupon with configured rewards and validity. / 보상 및 유효 기간이 설정된 새 쿠폰을 생성합니다.',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'COUPON',
    action: 'CREATE_COUPON',
    extractMetadata: (req) => ({ body: req.body }),
  })
  @ApiStandardResponse(CouponAdminResponseDto, { status: 201 })
  async createCoupon(
    @CurrentUser() admin: AuthenticatedUser,
    @Body() dto: CreateCouponAdminRequestDto,
  ): Promise<CouponAdminResponseDto> {
    const coupon = await this.createCouponService.execute(dto, admin.id);
    return this.mapToResponseDto(coupon);
  }

  /**
   * 쿠폰 목록 조회
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Coupon List / 쿠폰 목록 조회',
    description: 'Retrieves a list of coupons with paging and filters. / 페이징 및 필터가 적용된 쿠폰 목록을 조회합니다.',
  })
  @ApiPaginatedResponse(CouponAdminResponseDto, { status: 200 })
  async getCoupons(
    @Query() query: GetCouponListAdminQueryDto,
  ): Promise<{ data: CouponAdminResponseDto[]; total: number; page: number; limit: number }> {
    const { data, total, page, limit } = await this.getCouponListService.execute(query);
    return {
      data: data.map(this.mapToResponseDto.bind(this)),
      total,
      page,
      limit,
    };
  }

  /**
   * 쿠폰 상세 조회
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Coupon Detail / 쿠폰 상세 조회',
    description: 'Retrieves detailed information of a specific coupon. / 특정 쿠폰의 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'id', description: 'Coupon ID', example: '1' })
  @ApiStandardResponse(CouponAdminResponseDto, { status: 200 })
  async getCoupon(
    @Param('id') id: string,
  ): Promise<CouponAdminResponseDto> {
    const coupon = await this.getCouponDetailService.execute(BigInt(id));
    return this.mapToResponseDto(coupon);
  }

  /**
   * 쿠폰 정보 수정
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Coupon Info / 쿠폰 정보 수정',
    description: 'Updates metadata, limits, and validity of a coupon. / 쿠폰의 메타데이터, 제한량, 유효 기간을 수정합니다.',
  })
  @ApiParam({ name: 'id', description: 'Coupon ID', example: '1' })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'COUPON',
    action: 'UPDATE_COUPON',
    extractMetadata: (req) => ({ id: req.params.id, body: req.body }),
  })
  @ApiStandardResponse(CouponAdminResponseDto, { status: 200 })
  async updateCoupon(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Body() dto: UpdateCouponAdminRequestDto,
  ): Promise<CouponAdminResponseDto> {
    const coupon = await this.updateCouponService.execute(BigInt(id), dto, admin.id);
    return this.mapToResponseDto(coupon);
  }

  /**
   * 쿠폰 상태 변경
   */
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Coupon Status / 쿠폰 상태 변경',
    description: 'Manually toggles the coupon status (e.g. to VOIDED). / 쿠폰 상태를 수동으로 변경합니다 (예: 무효화).',
  })
  @ApiParam({ name: 'id', description: 'Coupon ID', example: '1' })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'COUPON',
    action: 'UPDATE_STATUS',
    extractMetadata: (req) => ({ id: req.params.id, body: req.body }),
  })
  @ApiStandardResponse(CouponAdminResponseDto, { status: 200 })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Body() dto: UpdateCouponStatusAdminRequestDto,
  ): Promise<CouponAdminResponseDto> {
    const coupon = await this.updateCouponStatusService.execute(BigInt(id), dto, admin.id);
    return this.mapToResponseDto(coupon);
  }

  private mapToResponseDto(coupon: Coupon): CouponAdminResponseDto {
    return {
      id: coupon.id.toString(),
      code: coupon.code,
      metadata: coupon.metadata,
      isAllowlistOnly: coupon.isAllowlistOnly,
      maxUsage: coupon.maxUsage,
      usageCount: coupon.usageCount,
      maxUsagePerUser: coupon.maxUsagePerUser,
      status: coupon.status,
      startsAt: coupon.startsAt,
      expiresAt: coupon.expiresAt,
      createdAt: coupon.createdAt,
      updatedAt: coupon.updatedAt,
      rewards: (coupon.rewards || []).map((r) => ({
        id: r.id.toString(),
        rewardType: r.rewardType,
        currency: r.currency,
        amount: Number(r.amount),
        wageringMultiplier: r.wageringMultiplier ? Number(r.wageringMultiplier) : null,
        maxCashConversion: r.maxCashConversion ? Number(r.maxCashConversion) : null,
      })),
    };
  }
}
