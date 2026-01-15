import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    Body,
    UseGuards,
    HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadFileRequestDto } from './dto/request/upload-file.request.dto';
import { FileResponseDto } from './dto/response/file.response.dto';
import { EnvService } from 'src/common/env/env.service';
import { CreateFileService } from '../application/create-file.service';
import { FileEntity, FileValidationException } from '../domain';
import { SessionAuthGuard } from 'src/common/auth/guards/session-auth.guard';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { type AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { ApiStandardResponse, ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';

@Controller('file')
@ApiTags('File')
@ApiStandardErrors()
export class FileController {
    constructor(
        private readonly createFileService: CreateFileService,
        private readonly envService: EnvService,
    ) { }

    @Post('upload')
    @UseGuards(SessionAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({
        summary: 'Upload File / 파일 업로드',
        description: 'Upload a file to the storage system. / 파일을 스토리지 시스템에 업로드합니다.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'File and metadata / 파일 및 메타데이터',
        type: UploadFileRequestDto,
    })
    @ApiStandardResponse(FileResponseDto, {
        status: HttpStatus.CREATED,
        description: 'File uploaded successfully / 파일 업로드 성공',
    })
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadFileRequestDto,
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<FileResponseDto> {
        if (!file) {
            throw new FileValidationException('File is required / 파일은 필수입니다.');
        }

        const createdFile = await this.createFileService.execute({
            file,
            uploaderId: user.id,
            uploaderRole: user.role,
            usageType: dto.usageType,
            usageId: dto.usageId ? BigInt(dto.usageId) : undefined,
        });

        return this.toResponseDto(createdFile);
    }

    private toResponseDto(file: FileEntity): FileResponseDto {
        // Generate URL
        const cdnUrl = this.envService.app.cdnUrl || '';
        const baseUrl = cdnUrl.endsWith('/') ? cdnUrl : (cdnUrl ? `${cdnUrl}/` : '');
        const url = baseUrl ? `${baseUrl}${file.key}` : file.key;

        return {
            id: file.id?.toString() || '',
            bucket: file.bucket,
            path: file.path,
            key: file.key,
            url: url,
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size.toString(),
            width: file.width ?? undefined,
            height: file.height ?? undefined,
            status: file.status,
            accessType: file.accessType,
            uploaderId: file.uploaderId?.toString(),
            createdAt: file.createdAt,
            updatedAt: file.updatedAt,
        };
    }
}
