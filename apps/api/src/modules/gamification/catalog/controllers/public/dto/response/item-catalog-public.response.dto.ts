import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode, ItemType } from '@prisma/client';
import { ItemEffectPublicResponseDto } from './item-effect-public.response.dto';

export class ItemCatalogPublicResponseDto {
  @ApiProperty({ description: 'Item ID / 아이템 ID', example: 'itm_xyz' })
  id: string;

  @ApiProperty({ description: 'Item Code / 아이템 고유 코드', example: 'SWORD_001' })
  code: string;

  @ApiProperty({ description: 'Item Type / 아이템 타입', enum: ItemType })
  type: ItemType;

  @ApiProperty({ description: 'Item Name / 아이템 이름', example: 'Sword of Light' })
  name: string;

  @ApiProperty({ description: 'Item Description / 아이템 설명', example: 'A legendary sword that glows.', nullable: true })
  description: string | null;

  @ApiProperty({ type: [ItemEffectPublicResponseDto], description: 'Item Effects / 아이템 효과 목록' })
  effects: ItemEffectPublicResponseDto[];

  @ApiProperty({ description: 'Price / 가격', example: '10.00' })
  price: string;

  @ApiProperty({ description: 'Price Currency / 가격 통화', enum: ExchangeCurrencyCode })
  priceCurrency: ExchangeCurrencyCode;

  @ApiProperty({ description: 'Duration in days (if applicable) / 유효 기간(일)', example: 30, nullable: true })
  durationDays: number | null;
}
