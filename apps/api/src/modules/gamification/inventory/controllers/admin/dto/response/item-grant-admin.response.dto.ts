import { ApiProperty } from '@nestjs/swagger';

export class ItemGrantAdminResponseDto {
  @ApiProperty({ description: 'Success flag / 성공 여부', example: true })
  isSuccess: boolean;
}


