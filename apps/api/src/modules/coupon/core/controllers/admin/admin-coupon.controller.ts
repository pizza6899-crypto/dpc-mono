import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  Patch,
  Put,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
  ApiPaginatedResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import Decimal from 'decimal.js';

import { CreateCouponService } from '../../application/create-coupon.service';
import { GetCouponService } from '../../application/get-coupon.service';
import { ListCouponsService } from '../../application/list-coupons.service';
import { UpdateCouponService } from '../../application/update-coupon.service';
import { UpdateCouponStatusService } from '../../application/update-coupon-status.service';
import { UpdateCouponRewardsService } from '../../application/update-coupon-rewards.service';
import { ListCouponAllowlistService } from '../../application/list-coupon-allowlist.service';
import { AddCouponAllowlistService } from '../../application/add-coupon-allowlist.service';
import { RemoveCouponAllowlistService } from '../../application/remove-coupon-allowlist.service';
import { ClearCouponAllowlistService } from '../../application/clear-coupon-allowlist.service';

import { CreateAdminCouponRequestDto } from './dto/request/create-coupon.request.dto';
import { GetAdminCouponsRequestDto } from './dto/request/get-coupons.request.dto';
import { UpdateAdminCouponRequestDto } from './dto/request/update-coupon.request.dto';
import { UpdateAdminCouponStatusRequestDto } from './dto/request/update-coupon-status.request.dto';
import { UpdateAdminCouponRewardsRequestDto } from './dto/request/update-coupon-rewards.request.dto';
import { AddCouponAllowlistRequestDto, GetCouponAllowlistQueryDto } from './dto/request/coupon-allowlist.dto';
import { CouponResponseDto } from './dto/response/coupon.response.dto';
import { CouponAllowlistResponseDto } from './dto/response/coupon-allowlist.response.dto';
import { PaginatedData } from 'src/common/http/types/pagination.types';

@ApiTags('Admin Coupon')
@Controller('admin/coupons')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class AdminCouponController {
  constructor(
    private readonly createCouponService: CreateCouponService,
    private readonly getCouponService: GetCouponService,
    private readonly listCouponsService: ListCouponsService,
    private readonly updateCouponService: UpdateCouponService,
    private readonly updateCouponStatusService: UpdateCouponStatusService,
    private readonly updateCouponRewardsService: UpdateCouponRewardsService,
    private readonly listCouponAllowlistService: ListCouponAllowlistService,
    private readonly addCouponAllowlistService: AddCouponAllowlistService,
    private readonly removeCouponAllowlistService: RemoveCouponAllowlistService,
    private readonly clearCouponAllowlistService: ClearCouponAllowlistService,
  ) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new coupon / 신규 쿠폰 생성',
    description:
      'Creates a new coupon including basic info, expiry, and 1:N rewards. / 기본 정보, 유효 기간, 리워드 설정을 포함하여 신규 쿠폰을 생성합니다.',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'COUPON',
    action: 'CREATE_COUPON',
    extractMetadata: (req) => ({ code: req.body.code }),
  })
  @ApiStandardResponse(CouponResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Successfully created coupon / 쿠폰 생성 성공',
  })
  async createCoupon(
    @CurrentUser() admin: AuthenticatedUser,
    @Body() dto: CreateAdminCouponRequestDto,
  ): Promise<CouponResponseDto> {
    const coupon = await this.createCouponService.execute({
      ...dto,
      adminId: admin.id,
      rewards: dto.rewards.map((r) => ({
        rewardType: r.rewardType,
        currency: r.currency,
        amount: new Decimal(r.amount),
        wageringMultiplier: r.wageringMultiplier ? new Decimal(r.wageringMultiplier) : null,
        maxCashConversion: r.maxCashConversion ? new Decimal(r.maxCashConversion) : null,
      })),
    });

    return this.mapToResponseDto(coupon);
  }

  @Get()
  @ApiOperation({
    summary: 'List coupons / 쿠폰 목록 조회',
    description:
      'Supports code search, status filtering, date range filtering, and pagination. / 코드 검색, 상태 필터링, 기간 필터링 및 페이징 처리를 지원합니다.',
  })
  @ApiPaginatedResponse(CouponResponseDto)
  async getCoupons(@Query() query: GetAdminCouponsRequestDto): Promise<PaginatedData<CouponResponseDto>> {
    const result = await this.listCouponsService.execute(query);

    return {
      data: result.data.map((coupon) => this.mapToResponseDto(coupon)),
      page: result.page,
      limit: result.limit,
      total: result.total,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get coupon details / 쿠폰 상세 조회',
    description:
      'Retrieves all configuration info and the linked rewards list for a specific coupon. / 특정 쿠폰의 모든 설정 정보와 연결된 리워드 리스트를 포함하여 조회합니다.',
  })
  @ApiStandardResponse(CouponResponseDto, {
    status: 200,
    description: 'Successfully retrieved coupon details / 쿠폰 상세 조회 성공',
  })
  async getCoupon(@Param('id') id: string): Promise<CouponResponseDto> {
    const coupon = await this.getCouponService.getById(BigInt(id));
    return this.mapToResponseDto(coupon);
  }


  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update coupon / 쿠폰 정보 수정',
    description:
      'Updates usage limits, valid period, metadata, etc. (Coupon code itself cannot be modified for security). / 수량 제한, 유효 기간, 메타데이터 등을 수정합니다. (보안상 쿠폰 코드는 수정 불가)',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'COUPON',
    action: 'UPDATE_COUPON',
    extractMetadata: (req) => ({ id: req.params.id }),
  })
  @ApiStandardResponse(CouponResponseDto, {
    status: 200,
    description: 'Successfully updated coupon / 쿠폰 정보 수정 성공',
  })
  async updateCoupon(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAdminCouponRequestDto,
  ): Promise<CouponResponseDto> {
    const coupon = await this.updateCouponService.execute(BigInt(id), {
      ...dto,
      adminId: admin.id,
    });

    return this.mapToResponseDto(coupon);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update coupon status / 쿠폰 상태 변경',
    description:
      'Manually toggles coupon status to ACTIVE, VOIDED, etc. / 쿠폰의 상태를 ACTIVE, VOIDED 등으로 수동 전환합니다.',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'COUPON',
    action: 'UPDATE_COUPON_STATUS',
    extractMetadata: (req) => ({ id: req.params.id, status: req.body.status }),
  })
  @ApiStandardResponse(CouponResponseDto, {
    status: 200,
    description: 'Successfully updated status / 상태 변경 성공',
  })
  async updateStatus(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAdminCouponStatusRequestDto,
  ): Promise<CouponResponseDto> {
    const coupon = await this.updateCouponStatusService.execute(BigInt(id), dto.status, admin.id);

    return this.mapToResponseDto(coupon);
  }

  @Put(':id/rewards')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update coupon rewards / 쿠폰 보상 목록 갱신',
    description:
      'Replaces the entire rewards list for a specific coupon. / 특정 쿠폰에 연결된 리워드 사양 전체를 교체하거나 수정합니다.',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'COUPON',
    action: 'UPDATE_COUPON_REWARDS',
    extractMetadata: (req) => ({ id: req.params.id }),
  })
  @ApiStandardResponse(CouponResponseDto, {
    status: 200,
    description: 'Successfully updated rewards / 보상 목록 갱신 성공',
  })
  async updateRewards(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAdminCouponRewardsRequestDto,
  ): Promise<CouponResponseDto> {
    const coupon = await this.updateCouponRewardsService.execute(
      BigInt(id),
      dto.rewards.map((r) => ({
        rewardType: r.rewardType,
        currency: r.currency,
        amount: new Decimal(r.amount),
        wageringMultiplier: r.wageringMultiplier ? new Decimal(r.wageringMultiplier) : null,
        maxCashConversion: r.maxCashConversion ? new Decimal(r.maxCashConversion) : null,
      })),
      admin.id,
    );

    return this.mapToResponseDto(coupon);
  }

  @Get(':id/allowlist')
  @ApiOperation({
    summary: 'List allowlist / 대상자 목록 조회',
    description:
      'Retrieves the list of user IDs registered for this coupon with pagination. / 해당 쿠폰을 사용할 수 있도록 등록된 유저 ID 리스트를 페이징하여 조회합니다.',
  })
  @ApiPaginatedResponse(CouponAllowlistResponseDto)
  async getAllowlist(
    @Param('id') id: string,
    @Query() query: GetCouponAllowlistQueryDto,
  ): Promise<PaginatedData<CouponAllowlistResponseDto>> {
    const result = await this.listCouponAllowlistService.execute({
      couponId: BigInt(id),
      page: query.page!,
      limit: query.limit!,
      sortBy: query.sortBy!,
      sortOrder: query.sortOrder!,
    });

    return {
      data: result.data.map((item) => ({
        userId: item.userId.toString(),
        createdAt: item.createdAt,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Post(':id/allowlist')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add to allowlist / 대상자 대량 등록',
    description: 'Adds multiple user IDs to the allowlist at once. / 특정 쿠폰에 유저 ID 목록을 한꺼번에 추가합니다.',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'COUPON',
    action: 'ADD_COUPON_ALLOWLIST',
    extractMetadata: (req) => ({ id: req.params.id }),
  })
  @ApiStandardResponse(Object, { status: 200, description: 'Successfully added / 등록 성공' })
  async addAllowlist(@Param('id') id: string, @Body() dto: AddCouponAllowlistRequestDto): Promise<void> {
    await this.addCouponAllowlistService.execute(
      BigInt(id),
      dto.userIds.map((uid) => BigInt(uid)),
    );
  }

  @Delete(':id/allowlist/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove from allowlist / 대상자 개별 제거',
    description: 'Removes a specific user from the allowlist. / 화이트리스트에서 특정 유저를 제외합니다.',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'COUPON',
    action: 'REMOVE_COUPON_ALLOWLIST',
    extractMetadata: (req) => ({ id: req.params.id, userId: req.params.userId }),
  })
  @ApiStandardResponse(Object, { status: 200, description: 'Successfully removed / 제거 성공' })
  async removeAllowlist(@Param('id') id: string, @Param('userId') userId: string): Promise<void> {
    await this.removeCouponAllowlistService.execute(BigInt(id), BigInt(userId));
  }

  @Delete(':id/allowlist')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear allowlist / 대상자 전체 초기화',
    description: 'Removes all users from the allowlist for this coupon. / 해당 쿠폰에 등록된 모든 화이트리스트 정보를 삭제합니다.',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'COUPON',
    action: 'CLEAR_COUPON_ALLOWLIST',
    extractMetadata: (req) => ({ id: req.params.id }),
  })
  @ApiStandardResponse(Object, { status: 200, description: 'Successfully cleared / 초기화 성공' })
  async clearAllowlist(@Param('id') id: string): Promise<void> {
    await this.clearCouponAllowlistService.execute(BigInt(id));
  }

  private mapToResponseDto(entity: any): CouponResponseDto {
    const props = entity.toProps();
    return {
      id: props.id.toString(),
      code: props.code,
      metadata: props.metadata,
      isAllowlistOnly: props.isAllowlistOnly,
      maxUsage: props.maxUsage,
      usageCount: props.usageCount,
      maxUsagePerUser: props.maxUsagePerUser,
      status: props.status,
      startsAt: props.startsAt,
      expiresAt: props.expiresAt,
      rewards: props.rewards.map((r: any) => ({
        rewardType: r.rewardType,
        currency: r.currency,
        amount: r.amount.toString(),
        wageringMultiplier: r.wageringMultiplier?.toString() ?? null,
        maxCashConversion: r.maxCashConversion?.toString() ?? null,
      })),
      createdBy: props.createdBy?.toString() ?? null,
      updatedBy: props.updatedBy?.toString() ?? null,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }
}
