import { ApiPropertyOptional } from '@nestjs/swagger';
import { QuestType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { createPaginationQueryDto } from 'src/common/http/types';

export class GetQuestsAdminQueryDto extends createPaginationQueryDto({}, [
  'createdAt',
  'updatedAt',
  'id',
  'type',
  'isActive',
]) {
  @ApiPropertyOptional({
    description: 'Filter by ID / ID로 필터링',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    description: 'Filter by Quest Type / 퀘스트 유형으로 필터링',
    enum: QuestType,
  })
  @IsOptional()
  @IsEnum(QuestType)
  type?: QuestType;


  @ApiPropertyOptional({
    description: 'Filter by IsActive / 활성화 여부로 필터링',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Search keyword for title / 제목 키워드 검색',
  })
  @IsOptional()
  @IsString()
  keyword?: string;
}
