// src/modules/affiliate/commission/controllers/admin/dto/request/reset-custom-rate.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumberString, IsString } from 'class-validator';

export class ResetCustomRateDto {
  @ApiProperty({
    description: '어필리에이트 ID',
    example: '123',
  })
  @IsNumberString()
  @Transform(({ value }) => (value ? BigInt(value) : value))
  affiliateId: bigint;
}
