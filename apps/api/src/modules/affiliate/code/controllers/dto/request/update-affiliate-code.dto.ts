// src/modules/affiliate/code/controllers/dto/request/update-affiliate-code.dto.ts
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
}
