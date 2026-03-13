import { ApiPropertyOptional } from '@nestjs/swagger';
import { QuestType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { createPaginationQueryDto } from 'src/common/http/types';

export class GetQuestsUserQueryDto extends createPaginationQueryDto({}, [
  'createdAt',
  'displayOrder',
]) {
  @ApiPropertyOptional({
    description: 'Filter by Quest Type / 퀘스트 유형으로 필터링',
    enum: QuestType,
  })
  @IsOptional()
  @IsEnum(QuestType)
  type?: QuestType;
}
