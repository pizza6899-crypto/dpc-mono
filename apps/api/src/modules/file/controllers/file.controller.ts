import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    Body,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadFileRequestDto } from './dto/upload-file.request.dto';
import { UploadFileResponseDto } from './dto/upload-file.response.dto';
import { EnvService } from 'src/common/env/env.service';
import { UploadFileService } from '../application/upload-file.service';

@Controller('file')
export class FileController {
    constructor(
        private readonly uploadFileService: UploadFileService,
        private readonly envService: EnvService,
    ) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadFileRequestDto,
    ): Promise<UploadFileResponseDto> {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        const key = await this.uploadFileService.execute(file, dto.folder);

        // CDN URL 생성
        // 만약 staticAssetsBaseUrl이 전체 URL이면 그대로 사용, 아니면 path만 있는 경우 처리 필요
        // env.config.ts를 보면 staticAssetsBaseUrl은 '/static' 이 기본값.
        // 하지만 S3/CDN을 쓴다면 env.app.cdnUrl 같은 설정이 있을 것 (env.types.ts에 cdnUrl이 있음)
        const cdnUrl = this.envService.app.cdnUrl || 'https://example.com'; // 임시 폴백

        // cdnUrl이 '/'로 끝나지 않으면 추가
        const baseUrl = cdnUrl.endsWith('/') ? cdnUrl : `${cdnUrl}/`;
        const url = `${baseUrl}${key}`;

        return {
            key,
            url,
        };
    }
}
