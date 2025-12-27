// src/modules/affiliate/code/controllers/dto/response/get-codes.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { AffiliateCodeResponseDto } from './affiliate-code.response.dto';

export class GetCodesResponseDto {
  @ApiProperty({
    description: 'Affiliate codes / 어플리에이트 코드 목록',
    type: [AffiliateCodeResponseDto],
  })
  codes: AffiliateCodeResponseDto[];

  @ApiProperty({
    description: 'Total count / 전체 개수',
    example: 5,
  })
  total: number;

  @ApiProperty({
    description: 'Maximum codes per user / 사용자당 최대 코드 개수',
    example: 20,
  })
  limit: number;
}
