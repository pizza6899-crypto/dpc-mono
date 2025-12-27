import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from 'src/platform/http/decorators/api-response.decorator';
import { Public } from 'src/platform/auth/decorators/roles.decorator';
import { VipLevelService } from '../application/vip-level.service';
import {
  VipLevelResponseDto,
  VipLevelListResponseDto,
} from '../dtos/vip-level.dto';

@ApiTags('VIP Levels')
@Controller('vip/levels')
@ApiStandardErrors()
@Public()
export class VipLevelController {
  constructor(private readonly vipLevelService: VipLevelService) {}

  @Get()
  @ApiOperation({ summary: 'Get all VIP levels / 모든 VIP 레벨 조회' })
  @ApiStandardResponse(VipLevelListResponseDto, {
    status: 200,
    description:
      'Successfully retrieved VIP level list / VIP 레벨 목록 조회 성공',
  })
  async getAllLevels(): Promise<VipLevelListResponseDto> {
    const levels = await this.vipLevelService.getAllLevels();
    return { levels };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific VIP level / 특정 VIP 레벨 조회' })
  @ApiStandardResponse(VipLevelResponseDto, {
    status: 200,
    description: 'Successfully retrieved VIP level / VIP 레벨 조회 성공',
  })
  async getLevelById(@Param('id') id: number): Promise<VipLevelResponseDto> {
    return await this.vipLevelService.getLevelById(id);
  }
}
