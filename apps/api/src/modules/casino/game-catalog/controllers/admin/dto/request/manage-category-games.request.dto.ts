import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class AddGamesToCategoryRequestDto {
  @ApiProperty({
    description:
      '추가할 게임 ID 목록 (숫자) / List of Game IDs to add (numeric)',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  gameIds: string[];
}

export class RemoveGamesFromCategoryRequestDto {
  @ApiProperty({
    description:
      '제거할 게임 ID 목록 (숫자) / List of Game IDs to remove (numeric)',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  gameIds: string[];
}
