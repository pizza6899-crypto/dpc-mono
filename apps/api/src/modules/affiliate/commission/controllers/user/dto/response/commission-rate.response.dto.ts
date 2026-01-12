// src/modules/affiliate/commission/controllers/user/dto/response/commission-rate.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class CommissionRateResponseDto {
  @ApiProperty({
    description: '티어 코드',
    example: 'BRONZE',
  })
  tierCode: string;

  @ApiProperty({
    description: '기본 요율',
    example: '0.005',
    type: String,
  })
  baseRate: string;

  @ApiProperty({
    description: '수동 설정 요율',
    example: '0.01',
    type: String,
    nullable: true,
  })
  customRate: string | null;

  @ApiProperty({
    description: '수동 요율 사용 여부',
    example: false,
  })
  isCustomRate: boolean;

  @ApiProperty({
    description: '실제 적용되는 요율',
    example: '0.005',
    type: String,
  })
  effectiveRate: string;
}
