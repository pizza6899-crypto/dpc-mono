import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { UpdateDrawConfigItemAdminRequestDto } from './update-draw-config-item-admin.request.dto';

/**
 * 유물 뽑기 확률 일괄 업데이트 요청 DTO
 */
export class UpdateDrawConfigsAdminRequestDto {
  @ApiProperty({
    description: 'List of draw configurations / 등급별 확률 설정 목록',
    type: [UpdateDrawConfigItemAdminRequestDto]
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UpdateDrawConfigItemAdminRequestDto)
  configs: UpdateDrawConfigItemAdminRequestDto[];
}

