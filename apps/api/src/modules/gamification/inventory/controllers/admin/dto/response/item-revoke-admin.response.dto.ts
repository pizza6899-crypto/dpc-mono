import { ApiProperty } from '@nestjs/swagger';

export class ItemRevokeAdminResponseDto {
  @ApiProperty({ description: 'Success flag / 성공 여부', example: true })
  isSuccess: boolean;
}
