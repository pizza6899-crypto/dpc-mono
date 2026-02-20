// src/modules/affiliate/code/controllers/user/dto/request/update-affiliate-code.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAffiliateCodeDto {
  @ApiProperty({
    description: 'Campaign name / 캠페인 이름',
    example: 'Winter Campaign',
    required: false,
  })
  @IsOptional()
  @IsString()
  campaignName?: string;

  @ApiProperty({
    description: 'Is active / 활성화 여부',
    example: true,
    required: false,
  })
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Is default / 기본 코드 여부',
    example: true,
    required: false,
  })
  @IsOptional()
  isDefault?: boolean;
}
