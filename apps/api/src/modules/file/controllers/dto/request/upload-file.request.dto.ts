import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FileUsageType } from '../../../domain';

export class UploadFileRequestDto {
    @ApiProperty({
        description: '파일 사용처 타입 (File Usage Type)',
        required: true,
        enum: FileUsageType,
        example: FileUsageType.USER_PROFILE
    })
    @IsEnum(FileUsageType)
    usageType: FileUsageType;

    @ApiProperty({
        description: '파일 사용처 ID (File Usage ID)',
        required: false,
        example: '123'
    })
    @IsString()
    @IsOptional()
    usageId?: string;
}
