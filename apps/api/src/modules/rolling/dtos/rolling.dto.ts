// src/modules/rolling/dtos/rolling.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { RollingStatus, RollingSourceType } from '@repo/database';

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
