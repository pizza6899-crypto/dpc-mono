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
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from 'src/platform/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/platform/auth/decorators/current-user.decorator';
import { RequestClientInfoParam } from 'src/platform/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
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

@ApiTags('Affiliate Codes (어플리에이트 코드)')
@Controller('affiliate-codes')
export class AffiliateCodeController {
  constructor(
    private readonly createCodeService: CreateCodeService,
    private readonly findCodesService: FindCodesService,
    private readonly findDefaultCodeService: FindDefaultCodeService,
    private readonly updateCodeService: UpdateCodeService,
    private readonly toggleCodeActiveService: ToggleCodeActiveService,
    private readonly setCodeAsDefaultService: SetCodeAsDefaultService,
    private readonly validateCodeFormatService: ValidateCodeFormatService,
  ) {}

  /**
   * 어플리에이트 코드 생성
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create affiliate code / 어플리에이트 코드 생성' })
  async create(
    @CurrentUser() user: CurrentUserWithSession,
    @Body() dto: CreateAffiliateCodeDto,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<AffiliateCodeResponseDto> {
    const code = await this.createCodeService.execute({
      userId: user.id,
      campaignName: dto.campaignName,
      requestInfo,
    });
    return this.toResponse(code);
  }

  /**
   * 어플리에이트 코드 목록 조회
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get affiliate codes / 어플리에이트 코드 목록 조회',
  })
  async getCodes(
    @CurrentUser() user: CurrentUserWithSession,
  ): Promise<GetCodesResponseDto> {
    const result = await this.findCodesService.execute({ userId: user.id });
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
  @ApiOperation({
    summary: 'Get default affiliate code / 대표 어플리에이트 코드 조회',
  })
  async getDefaultCode(
    @CurrentUser() user: CurrentUserWithSession,
  ): Promise<AffiliateCodeResponseDto | null> {
    const code = await this.findDefaultCodeService.execute({ userId: user.id });
    return code ? this.toResponse(code) : null;
  }

  /**
   * 어플리에이트 코드 수정
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update affiliate code / 어플리에이트 코드 수정' })
  async update(
    @CurrentUser() user: CurrentUserWithSession,
    @Param('id') id: string,
    @Body() dto: UpdateAffiliateCodeDto,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<AffiliateCodeResponseDto> {
    const code = await this.updateCodeService.execute({
      id,
      userId: user.id,
      campaignName: dto.campaignName,
      requestInfo,
    });
    return this.toResponse(code);
  }

  /**
   * 어플리에이트 코드 활성화/비활성화 토글
   */
  @Patch(':id/toggle-active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Toggle affiliate code active status / 어플리에이트 코드 활성화/비활성화 토글',
  })
  async toggleActive(
    @CurrentUser() user: CurrentUserWithSession,
    @Param('id') id: string,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<AffiliateCodeResponseDto> {
    const code = await this.toggleCodeActiveService.execute({
      id,
      userId: user.id,
      requestInfo,
    });
    return this.toResponse(code);
  }

  /**
   * 기본 어플리에이트 코드 설정
   */
  @Patch(':id/set-default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set default affiliate code / 기본 어플리에이트 코드 설정',
  })
  async setDefault(
    @CurrentUser() user: CurrentUserWithSession,
    @Param('id') id: string,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<AffiliateCodeResponseDto> {
    const code = await this.setCodeAsDefaultService.execute({
      id,
      userId: user.id,
      requestInfo,
    });
    return this.toResponse(code);
  }

  /**
   * 코드 형식 검증
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate code format / 코드 형식 검증' })
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
      userId: code.userId,
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

