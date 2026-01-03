// src/modules/affiliate/code/controllers/user/affiliate-code.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from 'src/common/http/decorators/api-response.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { CreateCodeService } from '../../application/create-code.service';
import { FindCodesService } from '../../application/find-codes.service';
import { FindDefaultCodeService } from '../../application/find-default-code.service';
import { UpdateCodeService } from '../../application/update-code.service';
import { ToggleCodeActiveService } from '../../application/toggle-code-active.service';
import { SetCodeAsDefaultService } from '../../application/set-code-as-default.service';
import { ValidateCodeFormatService } from '../../application/validate-code-format.service';
import { CreateAffiliateCodeDto } from './dto/request/create-affiliate-code.dto';
import { UpdateAffiliateCodeDto } from './dto/request/update-affiliate-code.dto';
import { ValidateCodeFormatDto } from './dto/request/validate-code-format.dto';
import { AffiliateCodeResponseDto } from './dto/response/affiliate-code.response.dto';
import { GetCodesResponseDto } from './dto/response/get-codes.response.dto';
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
    private readonly toggleCodeActiveService: ToggleCodeActiveService,
    private readonly setCodeAsDefaultService: SetCodeAsDefaultService,
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
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'AFFILIATE',
    action: 'AFFILIATE_CODE_LIST_VIEW',
    extractMetadata: (args, result) => ({
      count: result?.codes?.length ?? 0,
      total: result?.total ?? 0,
    }),
  })
  @ApiOperation({
    summary: 'Get affiliate codes / 어플리에이트 코드 목록 조회',
  })
  @ApiStandardResponse(GetCodesResponseDto, {
    status: HttpStatus.OK,
    description:
      'Successfully retrieved affiliate codes / 어플리에이트 코드 목록 조회 성공',
  })
  async getCodes(
    @CurrentUser() user: CurrentUserWithSession,
  ): Promise<GetCodesResponseDto> {
    const result = await this.findCodesService.execute({
      userId: user.id,
    });
    return {
      codes: result.codes.map((code) => this.toResponse(code)),
      total: result.total,
      limit: result.limit,
    };
  }

  /**
   * 대표 어플리에이트 코드 조회
   */
  @Get('default')
  @HttpCode(HttpStatus.OK)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'AFFILIATE',
    action: 'AFFILIATE_CODE_DEFAULT_VIEW',
    extractMetadata: (args, result) =>
      result ? { codeId: result.id, code: result.code } : undefined,
  })
  @ApiOperation({
    summary: 'Get default affiliate code / 대표 어플리에이트 코드 조회',
  })
  @ApiStandardResponse(AffiliateCodeResponseDto, {
    status: HttpStatus.OK,
    description:
      'Successfully retrieved default affiliate code / 대표 어플리에이트 코드 조회 성공',
  })
  async getDefaultCode(
    @CurrentUser() user: CurrentUserWithSession,
  ): Promise<AffiliateCodeResponseDto | null> {
    const code = await this.findDefaultCodeService.execute({
      userId: user.id,
    });
    return code ? this.toResponse(code) : null;
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
    });
    return this.toResponse(code);
  }

  /**
   * 어플리에이트 코드 활성화/비활성화 토글
   */
  @Patch(':id/toggle-active')
  @HttpCode(HttpStatus.OK)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'AFFILIATE',
    action: 'AFFILIATE_CODE_TOGGLE_ACTIVE',
    extractMetadata: (args, result) => ({
      codeId: result?.id,
      code: result?.code,
      isActive: result?.isActive,
    }),
  })
  @ApiOperation({
    summary:
      'Toggle affiliate code active status / 어플리에이트 코드 활성화/비활성화 토글',
  })
  @ApiParam({ name: 'id', description: 'Code ID / 코드 ID' })
  @ApiStandardResponse(AffiliateCodeResponseDto, {
    status: HttpStatus.OK,
    description:
      'Successfully toggled affiliate code status / 어플리에이트 코드 활성화 토글 성공',
  })
  async toggleActive(
    @CurrentUser() user: CurrentUserWithSession,
    @Param('id') id: string,
  ): Promise<AffiliateCodeResponseDto> {
    const code = await this.toggleCodeActiveService.execute({
      id,
      userId: user.id,
    });
    return this.toResponse(code);
  }

  /**
   * 기본 어플리에이트 코드 설정
   */
  @Patch(':id/set-default')
  @HttpCode(HttpStatus.OK)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'AFFILIATE',
    action: 'AFFILIATE_CODE_SET_DEFAULT',
    extractMetadata: (args, result) => ({
      codeId: result?.id,
      code: result?.code,
      isDefault: result?.isDefault,
    }),
  })
  @ApiOperation({
    summary: 'Set default affiliate code / 기본 어플리에이트 코드 설정',
  })
  @ApiParam({ name: 'id', description: 'Code ID / 코드 ID' })
  @ApiStandardResponse(AffiliateCodeResponseDto, {
    status: HttpStatus.OK,
    description:
      'Successfully set default affiliate code / 기본 어플리에이트 코드 설정 성공',
  })
  async setDefault(
    @CurrentUser() user: CurrentUserWithSession,
    @Param('id') id: string,
  ): Promise<AffiliateCodeResponseDto> {
    const code = await this.setCodeAsDefaultService.execute({
      id,
      userId: user.id,
    });
    return this.toResponse(code);
  }

  /**
   * 코드 형식 검증
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
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
      id: code.id,
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

