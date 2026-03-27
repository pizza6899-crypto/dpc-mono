import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

/**
 * [Artifact Inventory] 유물 장착 요청 DTO
 */
export class EquipArtifactRequestDto {
  @ApiProperty({
    description: 'User Artifact Instance ID / 장착할 유저 보유 유물 식별자',
    example: 'sqid_artifact_1',
  })
  @IsString()
  @IsNotEmpty()
  userArtifactId: string;

  @ApiProperty({
    description: 'Target Slot Number / 장착할 슬롯 번호 (1부터 시작)',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  slotNo: number;
}
