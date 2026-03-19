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
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
  ApiPaginatedResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { Admin } from 'src/common/auth/decorators/roles.decorator';
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

import { CreateAdminCouponRequestDto } from './dto/request/create-coupon.request.dto';
import { GetAdminCouponsRequestDto } from './dto/request/get-coupons.request.dto';
import { UpdateAdminCouponRequestDto } from './dto/request/update-coupon.request.dto';
import { UpdateAdminCouponStatusRequestDto } from './dto/request/update-coupon-status.request.dto';
import { CouponResponseDto } from './dto/response/coupon.response.dto';
import { PaginatedData } from 'src/common/http/types/pagination.types';

@ApiTags('Admin Coupon')
@Controller('admin/coupons')
@Admin()
@ApiStandardErrors()
export class AdminCouponController {
  constructor(
    private readonly createCouponService: CreateCouponService,
    private readonly getCouponService: GetCouponService,
    private readonly listCouponsService: ListCouponsService,
    private readonly updateCouponService: UpdateCouponService,
    private readonly updateCouponStatusService: UpdateCouponStatusService,
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
