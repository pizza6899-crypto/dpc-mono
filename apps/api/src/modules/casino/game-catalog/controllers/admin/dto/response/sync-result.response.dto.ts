import { ApiProperty } from '@nestjs/swagger';

export class SyncResultResponseDto {
  @ApiProperty({ description: 'Total items processed (처리된 총 항목 수)' })
  total: number;

  @ApiProperty({ description: 'Items created (새로 생성된 항목 수)' })
  created: number;

  @ApiProperty({ description: 'Items updated (업데이트된 항목 수)' })
  updated: number;

  @ApiProperty({ description: 'Items failed (실패한 항목 수)' })
  failed: number;

  @ApiProperty({ description: 'Execution time in ms (실행 시간 ms)' })
  executionTime: number;
}
