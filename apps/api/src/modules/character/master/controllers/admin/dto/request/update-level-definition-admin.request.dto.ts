import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';
import { TierCode, Prisma } from '@prisma/client';
import { Transform } from 'class-transformer';

/**
 * 특정 레벨 정의 업데이트 요청 DTO
 */
export class SaveLevelDefinitionAdminRequestDto {
  @ApiProperty({
    description: 'Level to define or update / 정의하거나 수정할 레벨 번호',
    example: 10,
  })
  @IsInt()
  @IsPositive()
  level: number;

  @ApiPropertyOptional({
    description: 'Required cumulative XP to achieve this level / 이 레벨에 도달하기 위한 누적 필요 경험치',
    example: '50000',
  })
  @IsOptional()
  @Transform(({ value }) => new Prisma.Decimal(value))
  requiredXp?: Prisma.Decimal;

  @ApiPropertyOptional({
    description: 'Tier category for this level / 해당 레벨의 티어 코드',
    enum: TierCode,
    example: TierCode.BRONZE,
  })
  @IsOptional()
  @IsEnum(TierCode)
  tierCode?: TierCode;

  @ApiPropertyOptional({
    description: 'Bonus stat points granted when achieving this level / 해당 레벨 도달 시의 스탯 가산 보상',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  levelUpStatPoints?: number;

  @ApiPropertyOptional({
    description: 'Custom tier badge image URL / 커스텀 티어 뱃지 이미지 URL',
    example: 'https://...',
  })
  @IsOptional()
  tierImageUrl?: string | null;
}
