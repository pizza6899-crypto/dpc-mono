import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

/**
 * [Admin] 아이템 지급 요청 DTO
 */
export class GrantItemAdminRequestDto {
  @ApiProperty({ description: 'Target User ID / 지급 대상 유저 ID', example: '1' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Item Catalog ID / 지급할 아이템 카탈로그 ID', example: '1' })
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({ description: 'Quantity / 지급 수량', example: 1, required: false })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  quantity?: number;
}
