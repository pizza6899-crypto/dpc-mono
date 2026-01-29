import { ApiProperty } from '@nestjs/swagger';

export class EvaluationLogResponseDto {
    @ApiProperty({ description: 'Log ID / 로그 ID' })
    id: string;

    @ApiProperty({ description: 'Start Time / 심사 시작 시간' })
    startedAt: Date;

    @ApiProperty({ description: 'Finish Time / 심사 종료 시간', nullable: true })
    finishedAt: Date | null;

    @ApiProperty({ description: 'Status / 심사 상태' })
    status: string;

    @ApiProperty({ description: 'Total Processed Count / 총 처리 유저 수' })
    totalProcessedCount: number;

    @ApiProperty({ description: 'Promoted Count / 승급 유저 수' })
    promotedCount: number;

    @ApiProperty({ description: 'Demoted Count / 강등 유저 수' })
    demotedCount: number;

    @ApiProperty({ description: 'Grace Period Count / 유예(경고) 처리 유저 수' })
    gracePeriodCount: number;

    @ApiProperty({ description: 'Maintained Count / 등급 유지 유저 수' })
    maintainedCount: number;

    @ApiProperty({ description: 'Error Message / 오류 메시지', nullable: true })
    errorMessage: string | null;
}
