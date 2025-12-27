// src/modules/rolling/dtos/rolling.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';
import { RollingStatus, RollingSourceType } from '@prisma/client';

export class RollingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: RollingSourceType })
  sourceType: RollingSourceType;

  @ApiProperty()
  requiredAmount: string;

  @ApiProperty()
  currentAmount: string;

  @ApiProperty()
  progressPercentage: number;

  @ApiProperty({ enum: RollingStatus })
  status: RollingStatus;

  @ApiProperty({ nullable: true })
  completedAt: Date | null;

  @ApiProperty({ nullable: true })
  cancelledAt: Date | null;

  @ApiProperty()
  createdAt: Date;
}

export class UserRollingSummaryDto {
  @ApiProperty({ type: [RollingResponseDto] })
  activeRollings: RollingResponseDto[];

  @ApiProperty()
  totalRequiredAmount: string;

  @ApiProperty()
  totalCurrentAmount: string;

  @ApiProperty()
  canWithdraw: boolean;
}
