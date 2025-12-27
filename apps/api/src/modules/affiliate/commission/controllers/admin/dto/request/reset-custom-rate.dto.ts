// src/modules/affiliate/commission/controllers/admin/dto/request/reset-custom-rate.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ResetCustomRateDto {
  @ApiProperty({
    description: '어필리에이트 ID',
    example: 'affiliate-123',
  })
  @IsString()
  affiliateId: string;
}
