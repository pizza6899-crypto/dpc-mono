import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class SyncGamesRequestDto {
    @ApiProperty({
        description: 'Mock 데이터 사용 여부 (true: Mock 사용, false: 실제 API 호출)',
        default: true,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
    useMock?: boolean = true;
}
