import { ApiProperty } from '@nestjs/swagger';
import { FileAccessType, FileStatus } from '../../../domain';

export class FileResponseDto {
    @ApiProperty({ description: '파일 ID', example: '123' })
    id: string;

    @ApiProperty({ description: '버킷 이름' })
    bucket: string;

    @ApiProperty({ description: '파일 경로' })
    path: string;

    @ApiProperty({ description: '파일 키' })
    key: string;

    @ApiProperty({ description: '파일 URL' })
    url: string;

    @ApiProperty({ description: '파일명' })
    filename: string;

    @ApiProperty({ description: 'MIME 타입' })
    mimetype: string;

    @ApiProperty({ description: '파일 크기 (bytes)' })
    size: string;

    @ApiProperty({ description: '너비 (이미지인 경우)', required: false })
    width?: number;

    @ApiProperty({ description: '높이 (이미지인 경우)', required: false })
    height?: number;

    @ApiProperty({ description: '파일 상태', enum: FileStatus })
    status: FileStatus;

    @ApiProperty({ description: '접근 권한', enum: FileAccessType })
    accessType: FileAccessType;

    @ApiProperty({ description: '업로더 ID', required: false })
    uploaderId?: string;

    @ApiProperty({ description: '생성일' })
    createdAt: Date;

    @ApiProperty({ description: '수정일' })
    updatedAt: Date;
}
