import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/platform/prisma/prisma.service';
import { VipLevelResponseDto } from '../dtos/vip-level.dto';
import { ApiException } from 'src/platform/http/exception/api.exception';
import { MessageCode } from 'src/platform/http/types/message-codes';
import { HttpStatus } from '@nestjs/common';

@Injectable()
export class VipLevelService {
  private readonly logger = new Logger(VipLevelService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 모든 VIP 레벨 조회
   */
  async getAllLevels(): Promise<VipLevelResponseDto[]> {
    const levels = await this.prisma.vipLevel.findMany({
      orderBy: { rank: 'asc' },
      select: {
        id: true,
        nameKey: true,
        rank: true,
        requiredRolling: true,
        levelUpBonus: true,
        compRate: true,
      },
    });

    return levels.map((level) => ({
      id: level.id,
      nameKey: level.nameKey,
      rank: level.rank,
      requiredRolling: level.requiredRolling.toNumber(),
      levelUpBonus: level.levelUpBonus.toNumber(),
      compRate: level.compRate.toNumber(),
    }));
  }

  /**
   * 특정 레벨 조회
   */
  async getLevelById(id: number): Promise<VipLevelResponseDto> {
    const level = await this.prisma.vipLevel.findUnique({
      where: { id },
      select: {
        id: true,
        nameKey: true,
        rank: true,
        requiredRolling: true,
        levelUpBonus: true,
        compRate: true,
      },
    });

    if (!level) {
      throw new ApiException(
        MessageCode.VIP_LEVEL_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'VIP level not found',
      );
    }

    return {
      id: level.id,
      nameKey: level.nameKey,
      rank: level.rank,
      requiredRolling: level.requiredRolling.toNumber(),
      levelUpBonus: level.levelUpBonus.toNumber(),
      compRate: level.compRate.toNumber(),
    };
  }
}
