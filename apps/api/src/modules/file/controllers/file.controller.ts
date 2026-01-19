import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    Body,
    UseGuards,
    HttpStatus,
    UseFilters,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadFileRequestDto } from './dto/request/upload-file.request.dto';
import { FileResponseDto } from './dto/response/file.response.dto';
import { EnvService } from 'src/common/env/env.service';
import { CreateFileService } from '../application/create-file.service';
import { AttachFileService } from '../application/attach-file.service';
import { FileEntity, FileValidationException, FileUsageEntity, FileAccessType, FileConstants, FileUsageType, getFileUsageConfig } from '../domain';
import { AttachFileRequestDto } from './dto/request/attach-file.request.dto';
import { FileUsageResponseDto } from './dto/response/file-usage.response.dto';
import { SessionAuthGuard } from 'src/common/auth/guards/session-auth.guard';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { type AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { ApiStandardResponse, ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { FileSizeExceptionFilter } from '../filters/file-size.filter';

@Controller('file')
@ApiTags('File')
@ApiStandardErrors()
export class FileController {
    constructor(
        private readonly createFileService: CreateFileService,
        private readonly attachFileService: AttachFileService,
        private readonly envService: EnvService,
        private readonly sqidsService: SqidsService,
    ) { }

    @Post('upload')
    @UseGuards(SessionAuthGuard)
    @UseFilters(FileSizeExceptionFilter)
    @UseInterceptors(FileInterceptor('file', {
        limits: {
            fileSize: FileConstants.MAX_SIZE,
        },
        fileFilter: (req, file, callback) => {
            if (!FileConstants.ALLOWED_MIME_TYPES.IMAGES.includes(file.mimetype as any)) {
                return callback(new FileValidationException('Invalid file type. Only image files are allowed. / 허용되지 않는 파일 형식입니다. 이미지만 업로드 가능합니다.'), false);
            }
            callback(null, true);
        },
    }))
    @ApiOperation({
        summary: 'Upload File / 파일 업로드',
        description: `
### 📝 파일 업로드 및 사용 시나리오 (File Upload & Usage Scenario)

이 시스템의 파일 처리는 **2단계(2-Step)**로 이루어집니다.
(File processing in this system consists of **2 steps**.)

#### 1️⃣ 1단계: 파일 업로드 (Step 1: File Upload)
- 이 API (**POST /file/upload**)를 호출하여 파일을 업로드합니다.
- 파일은 임시 저장소(temp)에 저장됩니다. (Files are saved in temporary storage).
- 응답으로 받은 **\`id\`** (예: \`f_abc123\`)를 프론트엔드에서 보관합니다. (Keep the received \`id\` in the frontend).

#### 2️⃣ 2단계: 파일 첨부 (Step 2: File Attachment)
- 비즈니스 로직(예: 프로필 수정, 게시글 작성) 완료 시, 보관해둔 **\`id\`**와 **사용처 정보(\`usageType\`, \`usageId\`)**를 가지고 **[POST /file/attach]** API를 호출합니다.
- 이 과정을 거쳐야 파일이 영구 저장되고 비즈니스 엔티티와 연결됩니다. (This step is required to permanently save the file and link it to a business entity).
- **주의:** 첨부(연결)되지 않은 파일은 일정 시간 후 자동 삭제될 수 있습니다. (Unattached files may be automatically deleted after a certain period).
        `,
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
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'FILE',
        action: 'FILE_UPLOAD',
        extractMetadata: (req, args, result: FileResponseDto) => ({
            fileId: result?.id,
            filename: args[0]?.originalname,
            mimetype: args[0]?.mimetype,
            size: args[0]?.size,
            accessType: args[1]?.accessType,
        }),
    })
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadFileRequestDto,
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<FileResponseDto> {
        if (!file) {
            throw new FileValidationException('File is required.');
        }

        const createdFile = await this.createFileService.execute({
            file,
            uploaderId: user.id,
            accessType: dto.accessType || FileAccessType.PRIVATE,
        });

        return this.toResponseDto(createdFile);
    }

    @Post('attach')
    @UseGuards(SessionAuthGuard)
    @ApiOperation({
        summary: 'Attach File / 파일 첨부',
        description: 'Attach uploaded files to a specific usage. / 업로드된 파일들을 특정 사용처에 첨부(연결)합니다.',
    })
    @ApiBody({ type: AttachFileRequestDto })
    @ApiStandardResponse(FileUsageResponseDto, {
        status: HttpStatus.CREATED,
        description: 'Files attached successfully / 파일 첨부 성공',
        isArray: true,
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'FILE',
        action: 'FILE_ATTACH',
        extractMetadata: (req, args, result: FileUsageResponseDto[]) => ({
            fileCount: result?.length,
            usageType: args[0]?.usageType,
            usageId: args[0]?.usageId,
            fileIds: args[0]?.fileIds,
        }),
    })
    async attachFile(
        @Body() dto: AttachFileRequestDto,
    ): Promise<FileUsageResponseDto[]> {
        const usageId = this.resolveUsageId(dto.usageType, dto.usageId);

        const fileUsages = await this.attachFileService.execute({
            fileIds: dto.fileIds,
            usageType: dto.usageType,
            usageId: usageId,
        });

        return fileUsages.map(usage => this.toUsageResponseDto(usage));
    }

    private resolveUsageId(usageType: string, id: string): bigint {
        // 1. If strictly numeric string, parse as BigInt
        if (/^\d+$/.test(id)) {
            return BigInt(id);
        }

        // 2. If encoded string, try to decode based on usageType
        const type = usageType as FileUsageType;
        if (Object.values(FileUsageType).includes(type)) {
            const config = getFileUsageConfig(type);
            if (config.sqidsPrefix) {
                return this.sqidsService.decode(id, config.sqidsPrefix);
            }
        }

        throw new FileValidationException('Invalid usageId format or unknown usage type for decoding.');
    }



    private toResponseDto(file: FileEntity): FileResponseDto {
        let url: string | undefined;

        if (file.accessType !== FileAccessType.PRIVATE) {
            // Generate URL only for non-private files
            const cdnUrl = this.envService.app.cdnUrl || '';
            const baseUrl = cdnUrl.endsWith('/') ? cdnUrl : (cdnUrl ? `${cdnUrl}/` : '');
            url = baseUrl ? `${baseUrl}${file.key}` : file.key;
        }

        return {
            id: this.sqidsService.encode(file.id!, SqidsPrefix.FILE),
            url: url,
        };
    }
    private toUsageResponseDto(usage: FileUsageEntity): FileUsageResponseDto {
        return {
            id: usage.id?.toString() || '',
            fileId: this.sqidsService.encode(usage.fileId, SqidsPrefix.FILE), // Encode fileId in response
            usageType: usage.usageType,
            usageId: usage.usageId.toString(),
            order: usage.order,
            createdAt: usage.createdAt,
        };
    }
}
