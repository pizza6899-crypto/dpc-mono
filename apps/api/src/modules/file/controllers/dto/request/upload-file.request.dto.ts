import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { FileAccessType } from '../../../domain';

export class UploadFileRequestDto {
    @ApiProperty({
        description: '파일 접근 권한 설정 (File Access Type) - 기본값: PRIVATE',
        required: false,
        enum: FileAccessType,
        example: FileAccessType.PUBLIC,
        default: FileAccessType.PRIVATE
    })
    @IsOptional()
    @IsEnum(FileAccessType)
    accessType?: FileAccessType;

    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: '업로드할 파일 (Upload File)',
        required: true,
    })
    file: any;
}
