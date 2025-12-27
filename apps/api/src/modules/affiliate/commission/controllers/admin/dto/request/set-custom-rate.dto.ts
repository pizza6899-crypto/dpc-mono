// src/modules/affiliate/commission/controllers/admin/dto/request/set-custom-rate.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class SetCustomRateDto {
  @ApiProperty({
    description: '어필리에이트 ID',
    example: 'affiliate-123',
  })
  @IsString()
  affiliateId: string;

  @ApiProperty({
    description: '설정할 커미션 요율 (0.01 = 1%, 최대 1.0 = 100%)',
    example: '0.01',
    pattern: '^0(\\.\\d{1,4})?$|^1(\\.0{1,4})?$',
  })
  @IsString()
  @Matches(/^0(\.\d{1,4})?$|^1(\.0{1,4})?$/, {
    message:
      'Custom rate must be between 0 and 1 (0.01 = 1%, 1.0 = 100%) with up to 4 decimal places',
  })
  customRate: string;
}
