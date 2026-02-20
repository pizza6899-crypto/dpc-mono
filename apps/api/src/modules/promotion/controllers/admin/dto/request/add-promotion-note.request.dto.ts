// src/modules/promotion/controllers/admin/dto/request/add-promotion-note.request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AddPromotionNoteRequestDto {
  @ApiProperty({
    description: '추가할 관리자 메모',
    example: '이 프로모션은 설날 이벤트용입니다.',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  note: string;
}
