import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetCouponConfigService } from '../../application/get-coupon-config.service';
import { UpdateCouponConfigService } from '../../application/update-coupon-config.service';
import { CouponConfigResponseDto } from './dto/response/coupon-config.response.dto';
import { UpdateCouponConfigRequestDto } from './dto/request/update-coupon-config.request.dto';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { UserPayload } from '../../../../common/auth/types/user-payload.type';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';
import { JwtAuthGuard } from '../../../../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/auth/guards/roles.guard';

@ApiTags('[Admin] Coupon Config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@Controller('admin/coupons/config')
export class CouponConfigAdminController {
  constructor(
    private readonly getCouponConfigService: GetCouponConfigService,
    private readonly updateCouponConfigService: UpdateCouponConfigService,
  ) {}

  @ApiOperation({ summary: '쿠폰 시스템 전역 설정 조회' })
  @Get()
  async getConfig(): Promise<CouponConfigResponseDto> {
    const config = await this.getCouponConfigService.execute();
    return CouponConfigResponseDto.fromEntity(config);
  }

  @ApiOperation({ summary: '쿠폰 시스템 전역 설정 수정' })
  @Patch()
  async updateConfig(
    @CurrentUser() admin: UserPayload,
    @Body() dto: UpdateCouponConfigRequestDto,
  ): Promise<void> {
    await this.updateCouponConfigService.execute({
      ...dto,
      adminId: BigInt(admin.id),
    });
  }
}
