import { ApiProperty } from '@nestjs/swagger';

export class ItemGrantAdminResponseDto {
  @ApiProperty({ description: 'Inventory Entry ID / 지급된 인벤토리 ID', example: '1' })
  id: string;

  @ApiProperty({ description: 'Success flag / 성공 여부', example: true })
  isSuccess: boolean;
}
