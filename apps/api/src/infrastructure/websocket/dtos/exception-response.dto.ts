import { ApiProperty } from '@nestjs/swagger';
import { MessageCode } from 'src/common/http/types/message-codes';
import { nowUtcIso } from 'src/utils/date.util';

export class ExceptionResponseDto {
    @ApiProperty({
        description: '성공 여부 (Success flag, always false)',
        example: false,
    })
    success: boolean = false;

    @ApiProperty({
        description: '상태 코드 (Status code, HTTP standard)',
        example: 400,
    })
    statusCode: number;

    @ApiProperty({
        description: '메시지 코드 (Message code for i18n)',
        enum: MessageCode,
        example: MessageCode.VALIDATION_ERROR,
    })
    messageCode: MessageCode;

    @ApiProperty({
        description: '에러 이름 (Error name/type)',
        example: 'BadRequestException',
    })
    error: string;

    @ApiProperty({
        description: '에러 메시지 목록 (Error messages for debugging)',
        example: ['Validation failed'],
    })
    message: string[];

    @ApiProperty({
        description: '원래 요청된 이벤트 이름 (Original requested event name)',
        example: 'message',
    })
    originalEvent: string;

    @ApiProperty({
        description: '응답 시간 (Timestamp, ISO 8601 UTC)',
        example: '2024-01-01T00:00:00.000Z',
    })
    timestamp: string;

    static from(
        statusCode: number,
        messageCode: MessageCode,
        error: string,
        message: string[],
        originalEvent: string,
    ): ExceptionResponseDto {
        const dto = new ExceptionResponseDto();
        dto.success = false;
        dto.statusCode = statusCode;
        dto.messageCode = messageCode;
        dto.error = error;
        dto.message = message;
        dto.originalEvent = originalEvent;
        dto.timestamp = nowUtcIso();
        return dto;
    }
}
