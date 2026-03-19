import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiStandardResponse, ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { UserRoleType } from '@prisma/client';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { ApplyCouponService } from '../../application/apply-coupon.service';
import { ApplyCouponRequestDto } from './dto/request/apply-coupon.request.dto';
import { ApplyCouponResponseDto } from './dto/response/apply-coupon.response.dto';

@ApiTags('Coupon')
@Controller('coupons')
@RequireRoles(UserRoleType.USER)
@ApiStandardErrors()
export class CouponUserController {
  constructor(private readonly applyCouponService: ApplyCouponService) { }

  @Post('apply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Apply coupon code / 쿠폰 코드 적용',
    description: 'Validates and applies a coupon code to the current user. / 현재 유저가 입력한 쿠폰 코드의 유효성을 검사하고 보상을 지급합니다.',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'COUPON',
    action: 'REDEEM_COUPON',
    extractMetadata: (req) => ({ code: req.body.code }),
  })
  @ApiStandardResponse(ApplyCouponResponseDto, {
    status: HttpStatus.OK,
    description: 'Successfully applied coupon / 쿠폰 적용 및 보상 지급 성공',
  })
  async applyCoupon(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ApplyCouponRequestDto,
  ): Promise<ApplyCouponResponseDto> {
    const coupon = await this.applyCouponService.execute(BigInt(user.id), dto.code);
    const props = coupon.toProps();

    return {
      code: props.code,
      metadata: props.metadata,
      rewards: props.rewards.map((r) => ({
        rewardType: r.rewardType,
        currency: r.currency,
        amount: r.amount.toString(),
        wageringMultiplier: r.wageringMultiplier?.toString() ?? null,
        maxCashConversion: r.maxCashConversion?.toString() ?? null,
      })),
      message: 'Coupon successfully applied',
    };
  }
}
