import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

/**
 * [Artifact Synthesis] 유물 합성 요청 DTO
 * 
 * 특정 개수(예: 3개)의 유물을 소모하여 상위 등급 합성을 시도합니다.
 */
export class SynthesizeArtifactRequestDto {
  @ApiProperty({
    description: 'User Artifact IDs to consume / 합성에 사용할 보유 유물 ID 목록',
    example: ['sqid_1', 'sqid_2', 'sqid_3'],
    type: [String],
    minItems: 3,
    maxItems: 3,
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  ingredientIds: string[];
}
