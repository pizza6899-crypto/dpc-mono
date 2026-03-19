import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import {
  ApiStandardErrors,
  ApiStandardResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { GetCouponConfigService } from '../../application/get-coupon-config.service';
import { UpdateCouponConfigService } from '../../application/update-coupon-config.service';
import { CouponConfig } from '../../domain/coupon-config.entity';
import { UpdateCouponConfigRequestDto } from './dto/request/update-coupon-config.request.dto';
import { CouponConfigResponseDto } from './dto/response/coupon-config.response.dto';

@ApiTags('Admin Coupon Config')
@Controller('admin/coupons/config')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class CouponConfigAdminController {
  constructor(
    private readonly getCouponConfigService: GetCouponConfigService,
    private readonly updateCouponConfigService: UpdateCouponConfigService,
  ) {}

  /**
   * 전역 쿠폰 설정 조회
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Global Coupon Config / 쿠폰 시스템 전역 설정 조회',
    description:
      'Retrieves the global settings for the coupon system. / 쿠폰 시스템의 전역 설정을 조회합니다.',
  })
  @ApiStandardResponse(CouponConfigResponseDto, {
    status: 200,
    description: 'Successfully retrieved coupon configuration / 설정 조회 성공',
  })
  async getConfig(): Promise<CouponConfigResponseDto> {
    const config = await this.getCouponConfigService.execute();
    return this.mapToResponseDto(config);
  }

  /**
   * 전역 쿠폰 설정 수정
   */
  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Global Coupon Config / 쿠폰 시스템 전역 설정 수정',
    description:
      'Updates the settings for the coupon system. This affects the overall coupon behavior. / 쿠폰 시스템의 전역 설정을 변경합니다. 이는 데이터 전체 쿠폰 동작에 영향을 미칩니다.',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'COUPON',
    action: 'UPDATE_CONFIG',
    extractMetadata: (req) => ({ body: req.body }),
  })
  @ApiStandardResponse(CouponConfigResponseDto, {
    status: 200,
    description: 'Successfully updated coupon configuration / 설정 수정 성공',
  })
  async updateConfig(
    @CurrentUser() admin: AuthenticatedUser,
    @Body() dto: UpdateCouponConfigRequestDto,
  ): Promise<CouponConfigResponseDto> {
    const config = await this.updateCouponConfigService.execute({
      ...dto,
      adminId: admin.id,
    });
    return this.mapToResponseDto(config);
  }

  private mapToResponseDto(config: CouponConfig): CouponConfigResponseDto {
    const props = config.toProps();
    return {
      isCouponEnabled: props.isCouponEnabled,
      maxDailyAttemptsPerUser: props.maxDailyAttemptsPerUser,
      defaultExpiryDays: props.defaultExpiryDays,
      updatedAt: props.updatedAt,
      updatedBy: props.updatedBy?.toString() || null,
    };
  }
}
