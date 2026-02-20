import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateGameProviderRequestDto {
  @ApiProperty({ type: String, description: 'Aggregator ID / 어그리게이터 ID' })
  @IsString()
  aggregatorId: string;

  @ApiProperty({
    description: 'External Provider ID / 외부 프로바이더 ID (API 호출용)',
  })
  @IsString()
  externalId: string;

  @ApiProperty({ description: 'Provider name / 게임사 이름' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Provider identification code / 게임사 식별 코드',
  })
  @IsString()
  code: string;

  @ApiPropertyOptional({
    description: 'Logo image ID (File ID from /file/upload) / 로고 이미지 ID',
  })
  @IsString()
  @IsOptional()
  imageId?: string;

  @ApiPropertyOptional({ description: 'Is active / 활성 여부' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
