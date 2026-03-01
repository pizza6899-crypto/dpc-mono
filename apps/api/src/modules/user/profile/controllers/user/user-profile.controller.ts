import {
    Controller,
    Get,
    Patch,
    Body,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
    ApiStandardErrors,
    ApiStandardResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import * as AuthTypes from 'src/common/auth/types/auth.types';
import { MyProfileResponseDto } from './dto/response/my-profile.response.dto';
import { UpdateMyProfileRequestDto } from './dto/request/update-my-profile.request.dto';
import { UpdateNicknameRequestDto } from './dto/request/update-nickname.request.dto';
import { GetMyProfileService } from '../../application/get-my-profile.service';
import { UpdateMyProfileService } from '../../application/update-my-profile.service';
import { UpdateNicknameService } from '../../application/update-nickname.service';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';

@ApiTags('User Profile')
@Controller('users/me')
@ApiStandardErrors()
export class UserProfileController {
    constructor(
        private readonly getMyProfileService: GetMyProfileService,
        private readonly updateMyProfileService: UpdateMyProfileService,
        private readonly updateNicknameService: UpdateNicknameService,
    ) { }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get my profile / 내 프로필 정보 조회',
        description: '현재 로그인한 사용자의 상세 프로필 정보를 조회합니다.',
    })
    @ApiStandardResponse(MyProfileResponseDto, {
        status: HttpStatus.OK,
        description: 'Successfully retrieved profile / 프로필 조회 성공',
    })
    async getMyProfile(
        @CurrentUser() user: AuthTypes.AuthenticatedUser,
    ): Promise<MyProfileResponseDto> {
        return this.getMyProfileService.execute(user.id);
    }

    @Patch()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Update my profile / 내 프로필 정보 수정',
        description: '닉네임, 언어, 타임존 등 본인의 프로필 정보를 수정합니다.',
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'USER',
        action: 'UPDATE_MY_PROFILE',
        extractMetadata: (req) => ({ body: req.body }),
    })
    @ApiStandardResponse(MyProfileResponseDto, {
        status: HttpStatus.OK,
        description: 'Successfully updated profile / 프로필 수정 성공',
    })
    async updateMyProfile(
        @CurrentUser() user: AuthTypes.AuthenticatedUser,
        @Body() dto: UpdateMyProfileRequestDto,
    ): Promise<MyProfileResponseDto> {
        return this.updateMyProfileService.execute(user.id, dto);
    }

    @Patch('nickname')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Update my nickname / 내 닉네임 수정',
        description: '본인의 닉네임을 수정합니다. (중복 검사 및 금지어 필터링 포함)',
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'USER',
        action: 'UPDATE_MY_NICKNAME',
        extractMetadata: (req) => ({ body: req.body }),
    })
    @ApiStandardResponse(MyProfileResponseDto, {
        status: HttpStatus.OK,
        description: 'Successfully updated nickname / 닉네임 수정 성공',
    })
    async updateNickname(
        @CurrentUser() user: AuthTypes.AuthenticatedUser,
        @Body() dto: UpdateNicknameRequestDto,
    ): Promise<MyProfileResponseDto> {
        return this.updateNicknameService.execute(user.id, dto);
    }
}
