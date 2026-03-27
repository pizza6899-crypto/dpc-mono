import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * [Artifact Inventory] 유물 장착 해제 요청 DTO
 */
export class UnequipArtifactRequestDto {
  @ApiProperty({
    description: 'User Artifact Instance ID / 장착 해제할 유저 보유 유물 식별자',
    example: 'sqid_artifact_1',
  })
  @IsString()
  @IsNotEmpty()
  userArtifactId: string;
}
