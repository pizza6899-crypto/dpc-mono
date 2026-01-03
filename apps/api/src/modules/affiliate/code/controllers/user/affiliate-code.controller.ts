// src/modules/affiliate/code/controllers/user/affiliate-code.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
  ApiPaginatedResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { PaginatedResponseDto } from 'src/common/http/types/pagination.types';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { CreateCodeService } from '../../application/create-code.service';
import { FindCodesService } from '../../application/find-codes.service';
import { FindDefaultCodeService } from '../../application/find-default-code.service';
import { UpdateCodeService } from '../../application/update-code.service';
import { ValidateCodeFormatService } from '../../application/validate-code-format.service';
import { CreateAffiliateCodeDto } from './dto/request/create-affiliate-code.dto';
import { UpdateAffiliateCodeDto } from './dto/request/update-affiliate-code.dto';
import { ValidateCodeFormatDto } from './dto/request/validate-code-format.dto';
import { GetCodesRequestDto } from './dto/request/get-codes-request.dto';
import { AffiliateCodeResponseDto } from './dto/response/affiliate-code.response.dto';
import { ValidateCodeFormatResponseDto } from './dto/response/validate-code-format.response.dto';
import { AffiliateCode } from '../../domain';
import { LogType } from 'src/modules/audit-log/domain';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';

@ApiTags('Affiliate Codes (어플리에이트 코드)')
@Controller('affiliate-codes')
@ApiStandardErrors()
export class AffiliateCodeController {
  constructor(
    private readonly createCodeService: CreateCodeService,
    private readonly findCodesService: FindCodesService,
    private readonly findDefaultCodeService: FindDefaultCodeService,
    private readonly updateCodeService: UpdateCodeService,
    private readonly validateCodeFormatService: ValidateCodeFormatService,
  ) { }

  /**
   * 어플리에이트 코드 생성
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'AFFILIATE',
    action: 'AFFILIATE_CODE_CREATE',
    extractMetadata: (args, result) => ({
      codeId: result?.id,
      code: result?.code,
      campaignName: result?.campaignName,
      isDefault: result?.isDefault,
    }),
  })
  @ApiOperation({ summary: 'Create affiliate code / 어플리에이트 코드 생성' })
  @ApiStandardResponse(AffiliateCodeResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Successfully created affiliate code / 어플리에이트 코드 생성 성공',
  })
  async create(
    @CurrentUser() user: CurrentUserWithSession,
    @Body() dto: CreateAffiliateCodeDto,
  ): Promise<AffiliateCodeResponseDto> {
    const code = await this.createCodeService.execute({
      userId: user.id,
      campaignName: dto.campaignName,
    });
    return this.toResponse(code);
  }

  /**
   * 어플리에이트 코드 목록 조회
   */

  @Get()
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'AFFILIATE',
    action: 'AFFILIATE_CODE_LIST_VIEW',
    extractMetadata: (args, result) => ({
      count: result?.data?.length ?? 0,
      total: result?.total ?? 0,
    }),
  })
  @ApiOperation({
    summary: 'Get affiliate codes / 어플리에이트 코드 목록 조회',
    description:
      '사용자의 어플리에이트 코드 목록을 조회합니다. 만약 코드가 하나도 없다면 자동으로 대표 코드를 하나 생성하여 반환합니다.',
  })
  @ApiPaginatedResponse(AffiliateCodeResponseDto, {
    status: HttpStatus.OK,
    description:
      'Successfully retrieved affiliate codes / 어플리에이트 코드 목록 조회 성공',
  })
  async getCodes(
    @CurrentUser() user: CurrentUserWithSession,
    @Query() query: GetCodesRequestDto,
  ): Promise<PaginatedResponseDto<AffiliateCodeResponseDto>> {
    const result = await this.findCodesService.execute({
      userId: user.id,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return {
      data: result.codes.map((code) => this.toResponse(code)),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    } as unknown as PaginatedResponseDto<AffiliateCodeResponseDto>;
  }

  @Get('default')
  @HttpCode(HttpStatus.OK)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'AFFILIATE',
    action: 'AFFILIATE_CODE_DEFAULT_VIEW',
    extractMetadata: (args, result) => ({
      codeId: result?.id,
      code: result?.code,
    }),
  })
  @ApiOperation({
    summary: 'Get default affiliate code / 대표 어플리에이트 코드 조회',
    description:
      '사용자의 대표 어플리에이트 코드를 조회합니다. 만약 코드가 없다면 자동으로 하나를 생성하여 반환합니다.',
  })
  @ApiStandardResponse(AffiliateCodeResponseDto, {
    status: HttpStatus.OK,
    description:
      'Successfully retrieved default affiliate code / 대표 어플리에이트 코드 조회 성공',
  })
  async getDefaultCode(
    @CurrentUser() user: CurrentUserWithSession,
  ): Promise<AffiliateCodeResponseDto> {
    const code = await this.findDefaultCodeService.execute({
      userId: user.id,
    });
    return this.toResponse(code);
  }

  /**
   * 어플리에이트 코드 수정
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'AFFILIATE',
    action: 'AFFILIATE_CODE_UPDATE',
    extractMetadata: (args, result) => ({
      codeId: result?.id,
      code: result?.code,
      campaignName: result?.campaignName,
    }),
  })
  @ApiOperation({ summary: 'Update affiliate code / 어플리에이트 코드 수정' })
  @ApiParam({ name: 'id', description: 'Code ID / 코드 ID' })
  @ApiStandardResponse(AffiliateCodeResponseDto, {
    status: HttpStatus.OK,
    description: 'Successfully updated affiliate code / 어플리에이트 코드 수정 성공',
  })
  async update(
    @CurrentUser() user: CurrentUserWithSession,
    @Param('id') id: string,
    @Body() dto: UpdateAffiliateCodeDto,
  ): Promise<AffiliateCodeResponseDto> {
    const code = await this.updateCodeService.execute({
      id,
      userId: user.id,
      campaignName: dto.campaignName,
      isActive: dto.isActive,
      isDefault: dto.isDefault,
    });
    return this.toResponse(code);
  }


  /**
   * 코드 형식 검증
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'AFFILIATE',
    action: 'AFFILIATE_CODE_VALIDATE',
    extractMetadata: (args, result) => ({
      code: args[0]?.code,
      isValid: result?.isValid,
    }),
  })
  @ApiOperation({ summary: 'Validate code format / 코드 형식 검증' })
  @ApiStandardResponse(ValidateCodeFormatResponseDto, {
    status: HttpStatus.OK,
    description: 'Successfully validated code format / 코드 형식 검증 성공',
  })
  async validateCodeFormat(
    @Body() dto: ValidateCodeFormatDto,
  ): Promise<ValidateCodeFormatResponseDto> {
    const isValid = await this.validateCodeFormatService.execute({
      code: dto.code,
    });
    return { isValid };
  }

  /**
   * Domain 엔티티를 Response DTO로 변환
   */
  private toResponse(code: AffiliateCode): AffiliateCodeResponseDto {
    return {
      id: code.uid,
      code: code.code,
      campaignName: code.campaignName,
      isActive: code.isActive,
      isDefault: code.isDefault,
      expiresAt: code.expiresAt,
      createdAt: code.createdAt,
      updatedAt: code.updatedAt,
      lastUsedAt: code.lastUsedAt,
    };
  }
}

