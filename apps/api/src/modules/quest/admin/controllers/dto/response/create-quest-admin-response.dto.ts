import { ApiProperty } from '@nestjs/swagger';

export class CreateQuestAdminResponseDto {
  @ApiProperty({
    description: 'Created Quest ID / 생성된 퀘스트 ID',
    example: '1234567890',
  })
  id: string;
}
