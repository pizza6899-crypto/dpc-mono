import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExtraModels } from '@nestjs/swagger';
import { Admin } from '../../../../../common/auth/decorators/roles.decorator';
import { GetWageringConfigService } from '../../application/get-wagering-config.service';
import { UpdateWageringConfigService } from '../../application/update-wagering-config.service';
import { CurrentUser } from '../../../../../common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../../../common/auth/types/auth.types';
import { AuditLog } from '../../../../audit-log/infrastructure/audit-log.decorator';
import { LogType } from '../../../../audit-log/domain';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from '../../../../../common/http/decorators/api-response.decorator';
import {
  UpdateWageringConfigDto,
  UpdateWageringCurrencySettingDto,
} from './dto/request/update-wagering-config.dto';
import {
  WageringConfigAdminResponseDto,
  WageringCurrencySettingResponseDto,
} from './dto/response/wagering-config-admin.response.dto';
import { WageringConfig } from '../../domain';

@ApiTags('Admin Wagering Config')
@Controller('admin/wagering-configs')
@Admin()
@ApiExtraModels(
  UpdateWageringCurrencySettingDto,
  WageringCurrencySettingResponseDto,
)
export class WageringConfigAdminController {
  constructor(
    private readonly getService: GetWageringConfigService,
    private readonly updateService: UpdateWageringConfigService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get global wagering config / 글로벌 롤링 설정 조회',
  })
  @ApiStandardResponse(WageringConfigAdminResponseDto)
  @ApiStandardErrors()
  async getConfig(): Promise<WageringConfigAdminResponseDto> {
    const config = await this.getService.execute();
    return this.mapToResponse(config);
  }

  @Patch()
  @ApiOperation({
    summary: 'Update global wagering config / 글로벌 롤링 설정 수정',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'UPDATE_WAGERING_CONFIG',
    category: 'ADMIN',
    extractMetadata: (req) => ({
      updates: req.body,
    }),
  })
  @ApiStandardResponse(WageringConfigAdminResponseDto)
  @ApiStandardErrors()
  async updateConfig(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateWageringConfigDto,
  ): Promise<WageringConfigAdminResponseDto> {
    const updated = await this.updateService.execute({
      ...body,
      updatedBy: BigInt(user.id),
    });

    return this.mapToResponse(updated);
  }

  private mapToResponse(
    config: WageringConfig,
  ): WageringConfigAdminResponseDto {
    const rawSettings: Record<string, WageringCurrencySettingResponseDto> = {};
    for (const [currency, setting] of Object.entries(config.currencySettings)) {
      rawSettings[currency] =
        setting.toRaw() as unknown as WageringCurrencySettingResponseDto;
    }

    return {
      defaultBonusExpiryDays: config.defaultBonusExpiryDays,
      defaultDepositMultiplier: config.defaultDepositMultiplier.toNumber(),
      currencySettings: rawSettings,
      isWageringCheckEnabled: config.isWageringCheckEnabled,
      isAutoCancellationEnabled: config.isAutoCancellationEnabled,
      updatedAt: config.updatedAt,
      updatedBy: config.updatedBy?.toString() || null,
    };
  }
}
