import { ApiProperty } from '@nestjs/swagger';
import { MessageCode } from 'src/common/http/types/message-codes';
import { nowUtcIso } from 'src/utils/date.util';

export class SocketResponseDto<T = any> {
    @ApiProperty({
        description: '요청 성공 여부 (Request success flag)',
        example: true,
    })
    success: boolean;

    @ApiProperty({
        description: '메시지 코드 (Message code for i18n)',
        enum: MessageCode,
        example: MessageCode.SUCCESS,
        required: false,
    })
    messageCode?: MessageCode;

    @ApiProperty({
        description: '응답 메시지 (Response message for debugging)',
        example: 'Successfully processed',
        required: false,
    })
    message?: string;

    @ApiProperty({
        description: '응답 데이터 (Response data payload)',
        required: false,
    })
    data?: T;

    @ApiProperty({
        description: '응답 시간 (Timestamp, ISO 8601 UTC)',
        example: '2024-01-01T00:00:00.000Z',
    })
    timestamp: string;

    @ApiProperty({
        description: '상태 코드 (Status code, HTTP standard)',
        example: 200,
    })
    statusCode: number;

    static success<T>(
        data?: T,
        message?: string,
        messageCode: MessageCode = MessageCode.SUCCESS,
        statusCode: number = 200,
    ): SocketResponseDto<T> {
        return {
            success: true,
            messageCode,
            message,
            data,
            timestamp: nowUtcIso(),
            statusCode,
        };
    }

    static failure(
        message: string,
        messageCode: MessageCode = MessageCode.INTERNAL_SERVER_ERROR,
        statusCode: number = 400,
    ): SocketResponseDto {
        return {
            success: false,
            messageCode,
            message,
            timestamp: nowUtcIso(),
            statusCode,
        };
    }
}
