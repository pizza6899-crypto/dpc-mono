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
import { UploadFileAdminRequestDto } from './dto/request/upload-file-admin.request.dto';
import { FileAdminResponseDto } from './dto/response/file-admin.response.dto';
import { CreateFileService } from '../../application/create-file.service';
import { FileUrlService } from '../../application/file-url.service';
import {
  FileEntity,
  FileValidationException,
  FileRequiredException,
  FileAccessType,
  FileConstants,
} from '../../domain';
import { SessionAuthGuard } from 'src/common/auth/guards/session-auth.guard';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { type AuthenticatedUser } from 'src/common/auth/types/auth.types';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from 'src/common/http/decorators/api-response.decorator';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { FileSizeExceptionFilter } from '../../filters/file-size.filter';
import { MessageCode } from '@repo/shared';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';

@Controller('admin/file')
@ApiTags('Admin File')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class FileAdminController {
  constructor(
    private readonly createFileService: CreateFileService,
    private readonly fileUrlService: FileUrlService,
    private readonly sqidsService: SqidsService,
  ) { }

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
    summary: 'Upload Admin File / 어드민 전용 파일 업로드',
    description: `
어드민 권한이 필요한 파일(퀘스트 아이콘, 배너 등)을 업로드합니다.
업로드된 파일은 기본적으로 비공개 상태이며, 비즈니스 로직에 연결될 때 용도에 맞게 공개/비공개 처리가 결정됩니다.
    `,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File and metadata / 파일 및 메타데이터',
    type: UploadFileAdminRequestDto,
  })
  @ApiStandardResponse(FileAdminResponseDto, {
    status: HttpStatus.CREATED,
    description: 'File uploaded successfully / 파일 업로드 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'FILE',
    action: 'ADMIN_FILE_UPLOAD',
    extractMetadata: (req, args, result: FileAdminResponseDto) => ({
      fileId: result?.id,
      filename: args[0]?.originalname,
      mimetype: args[0]?.mimetype,
      size: args[0]?.size,
      accessType: FileAccessType.PRIVATE,
    }),
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileAdminRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FileAdminResponseDto> {
    if (!file) {
      throw new FileRequiredException();
    }

    const createdFile = await this.createFileService.execute({
      file,
      uploaderId: user.id,
      accessType: FileAccessType.PRIVATE,
    });

    return await this.toResponseDto(createdFile);
  }

  private async toResponseDto(file: FileEntity): Promise<FileAdminResponseDto> {
    return {
      id: this.sqidsService.encode(file.id!, SqidsPrefix.FILE),
      url: (await this.fileUrlService.getUrl(file)) ?? undefined,
    };
  }
}
