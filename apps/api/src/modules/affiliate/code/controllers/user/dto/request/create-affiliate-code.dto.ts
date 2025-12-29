// src/modules/affiliate/code/controllers/user/dto/request/create-affiliate-code.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateAffiliateCodeDto {
  @ApiProperty({
    description: 'Campaign name / 캠페인 이름',
    example: 'Summer Campaign',
    required: false,
  })
  @IsOptional()
  @IsString()
  campaignName?: string;
}

