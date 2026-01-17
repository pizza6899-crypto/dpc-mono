import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
    ApiStandardErrors,
    ApiStandardResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from 'src/generated/prisma';
import { LogType } from 'src/modules/audit-log/domain';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { SqidsService } from '../../sqids.service';
import { SqidsPrefix } from '../../sqids.constants';
import { DecodeSqidRequestDto } from './dto/request/decode-sqid.request.dto';
import { DecodeSqidResponseDto } from './dto/response/decode-sqid.response.dto';

// 접두사 → 타입명 매핑
const prefixToTypeMap: Record<string, string> = Object.fromEntries(
    Object.entries(SqidsPrefix).map(([key, value]) => [value, key])
);

@Controller('admin/sqids')
@ApiTags('Admin Sqids')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class SqidsAdminController {
    constructor(private readonly sqidsService: SqidsService) { }

    /**
     * Sqid 문자열을 원본 ID로 디코딩 (접두사 자동 감지)
     */
    @Post('decode')
    @HttpCode(HttpStatus.OK)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'SYSTEM',
        action: 'SQID_DECODE',
        extractMetadata: (_, args, result) => ({
            sqid: args[0]?.sqid,
            decodedId: result?.decodedId,
            detectedPrefix: result?.detectedPrefix,
        }),
    })
    @ApiOperation({
        summary: 'Decode Sqid to original ID / Sqid를 원본 ID로 디코딩',
        description: `
관리자가 인코딩된 Sqid 문자열을 원본 ID로 디코딩합니다.
접두사가 포함되어 있으면 자동으로 감지하여 처리합니다.

**지원 접두사:**
- u: USER (사용자)
- d: DEPOSIT (입금)
- w: WITHDRAWAL (출금)
- tx: TRANSACTION (거래)
- af: AFFILIATE (제휴)
        `,
    })
    @ApiStandardResponse(DecodeSqidResponseDto, {
        status: 200,
        description: 'Successfully decoded Sqid / Sqid 디코딩 성공',
    })
    async decodeSqid(
        @Body() dto: DecodeSqidRequestDto,
    ): Promise<DecodeSqidResponseDto> {
        const { id, prefix } = this.sqidsService.decodeAuto(dto.sqid);

        return {
            decodedId: id.toString(),
            originalSqid: dto.sqid,
            detectedPrefix: prefix,
            prefixType: prefix ? prefixToTypeMap[prefix] ?? null : null,
        };
    }
}
