import { ApiProperty } from '@nestjs/swagger';

export class CheckAvailabilityResponseDto {
    @ApiProperty({
        description: 'Whether the field is available (true: usable, false: duplicate) / 사용 가능 여부 (true: 사용 가능, false: 중복됨)',
    })
    available: boolean;

    @ApiProperty({
        description: 'Message describing the result / 결과 메시지',
    })
    message: string;
}
