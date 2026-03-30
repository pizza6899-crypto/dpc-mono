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
import { FileUrlService } from '../application/file-url.service';
import {
  FileEntity,
  FileValidationException,
  FileRequiredException,
  FileAccessType,
  FileConstants,
} from '../domain';
import { SessionAuthGuard } from 'src/common/auth/guards/session-auth.guard';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { type AuthenticatedUser } from 'src/common/auth/types/auth.types';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from 'src/common/http/decorators/api-response.decorator';
import { SqidsService } from 'src/infrastructure/sqids/sqids.service';
import { SqidsPrefix } from 'src/infrastructure/sqids/sqids.constants';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { FileSizeExceptionFilter } from '../filters/file-size.filter';
import { MessageCode } from '@repo/shared';

@Controller('file')
@ApiTags('User File')
@ApiStandardErrors()
export class FileController {
  constructor(
    private readonly createFileService: CreateFileService,
    private readonly fileUrlService: FileUrlService,
    private readonly sqidsService: SqidsService,
  ) {}

  @Post('upload')
  @UseGuards(SessionAuthGuard)
  @UseFilters(FileSizeExceptionFilter)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: FileConstants.MAX_SIZE,
      },
      fileFilter: (req, file, callback) => {
        if (
          !FileConstants.ALLOWED_MIME_TYPES.IMAGES.includes(
            file.mimetype as any,
          )
        ) {
          return callback(
            new FileValidationException(
              'Invalid file type. Only image files are allowed. / 허용되지 않는 파일 형식입니다. 이미지만 업로드 가능합니다.',
              MessageCode.FILE_EXTENSION_NOT_ALLOWED,
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @ApiOperation({
    summary: 'Upload File / 파일 업로드',
    description: `
### 📝 파일 업로드 사용법 (File Upload Usage)

1. **파일 업로드 (Upload File)**: 이 API (**POST /file/upload**)로 파일을 업로드합니다. (Upload the file using this API.)
2. **파일 ID 보관 (Save File ID)**: 응답의 **\`id\`** (예: \`f_abc123\`)를 프론트엔드에서 보관합니다. (Store the returned **id** on the frontend.)
3. **비즈니스 API 호출 (Call Business API)**: 해당 파일 ID를 비즈니스 API (예: 카테고리 생성, 프로필 수정)에 전달합니다. (Pass the file ID to business APIs like profile updates.)
4. **자동 연결 (Automatic Link)**: 비즈니스 로직에서 파일이 자동으로 연결되고 영구 저장됩니다. (Files are automatically linked and persist in the business logic.)

**주의 (Note):** 연결되지 않은 파일은 일정 시간 후 자동 삭제될 수 있습니다. (Unlinked files may be deleted automatically after some time.)
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
      throw new FileRequiredException();
    }

    const createdFile = await this.createFileService.execute({
      file,
      uploaderId: user.id,
      accessType: dto.accessType || FileAccessType.PRIVATE,
    });

    return await this.toResponseDto(createdFile);
  }

  private async toResponseDto(file: FileEntity): Promise<FileResponseDto> {
    return {
      id: this.sqidsService.encode(file.id!, SqidsPrefix.FILE),
      url: (await this.fileUrlService.getUrl(file)) ?? undefined,
    };
  }
}
