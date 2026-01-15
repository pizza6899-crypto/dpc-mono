import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty, IsArray, ArrayNotEmpty } from 'class-validator';
import { FileUsageType } from '../../../domain';

export class AttachFileRequestDto {
    @ApiProperty({
        description: '파일 ID 목록 (List of File IDs)',
        required: true,
        type: [String],
        example: ['f_123', 'f_456']
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    fileIds: string[];

    @ApiProperty({
        description: '연결할 대상의 타입 (Usage Type)',
        required: true,
        enum: FileUsageType,
        example: FileUsageType.USER_PROFILE
    })
    @IsEnum(FileUsageType)
    usageType: FileUsageType;

    @ApiProperty({
        description: '연결할 대상의 ID (Target Usage ID)',
        required: true,
        example: '123'
    })
    @IsString()
    @IsNotEmpty()
    usageId: string;
}
