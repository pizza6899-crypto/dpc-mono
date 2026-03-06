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
import { UpdateMyAvatarRequestDto } from './dto/request/update-my-avatar.request.dto';
import { ProfileChangePasswordRequestDto } from './dto/request/change-password.request.dto';
import { UpdateMyCurrencyRequestDto } from './dto/request/update-my-currency.request.dto';
import { GetMyProfileService } from '../../application/get-my-profile.service';
import { UpdateMyProfileService } from '../../application/update-my-profile.service';
import { UpdateMyNicknameService } from '../../application/update-my-nickname.service';
import { UpdateMyAvatarService } from '../../application/update-my-avatar.service';
import { ChangeMyPasswordService } from '../../application/change-my-password.service';
import { UpdateMyCurrencyService } from '../../application/update-my-currency.service';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';

@ApiTags('User Profile')
@Controller('users/me')
@ApiStandardErrors()
export class UserProfileController {
    constructor(
        private readonly getMyProfileService: GetMyProfileService,
        private readonly updateMyProfileService: UpdateMyProfileService,
        private readonly updateMyNicknameService: UpdateMyNicknameService,
        private readonly updateMyAvatarService: UpdateMyAvatarService,
        private readonly changeMyPasswordService: ChangeMyPasswordService,
        private readonly updateMyCurrencyService: UpdateMyCurrencyService,
    ) { }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get my profile / 내 프로필 정보 조회',
        description: 'Retrieve detailed profile information of the currently logged-in user. / 현재 로그인한 사용자의 상세 프로필 정보를 조회합니다.',
    })
    @ApiStandardResponse(MyProfileResponseDto, {
        status: HttpStatus.OK,
        description: 'Successfully retrieved profile',
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
        description: 'Update personal profile information such as nickname, language, and timezone. / 닉네임, 언어, 타임존 등 본인의 프로필 정보를 수정합니다.',
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'USER',
        action: 'UPDATE_MY_PROFILE',
        extractMetadata: (req) => ({ body: req.body }),
    })
    @ApiStandardResponse(MyProfileResponseDto, {
        status: HttpStatus.OK,
        description: 'Successfully updated profile',
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
        description: 'Update the user nickname, including duplicate checks and forbidden word filtering. / 본인의 닉네임을 수정합니다. (중복 검사 및 금지어 필터링 포함)',
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'USER',
        action: 'UPDATE_MY_NICKNAME',
        extractMetadata: (req) => ({ body: req.body }),
    })
    @ApiStandardResponse(MyProfileResponseDto, {
        status: HttpStatus.OK,
        description: 'Successfully updated nickname',
    })
    async updateNickname(
        @CurrentUser() user: AuthTypes.AuthenticatedUser,
        @Body() dto: UpdateNicknameRequestDto,
    ): Promise<MyProfileResponseDto> {
        return this.updateMyNicknameService.execute(user.id, dto);
    }

    @Patch('avatar')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Update my avatar / 내 아바타 수정',
        description: 'Update the user avatar using an uploaded file ID. / 업로드된 파일 ID를 사용하여 본인의 아바타를 수정합니다.',
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'USER',
        action: 'UPDATE_MY_AVATAR',
        extractMetadata: (req) => ({ body: req.body }),
    })
    @ApiStandardResponse(MyProfileResponseDto, {
        status: HttpStatus.OK,
        description: 'Successfully updated avatar',
    })
    async updateAvatar(
        @CurrentUser() user: AuthTypes.AuthenticatedUser,
        @Body() dto: UpdateMyAvatarRequestDto,
    ): Promise<MyProfileResponseDto> {
        return this.updateMyAvatarService.execute(user.id, dto.fileId);
    }

    @Patch('password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Change my password / 내 비밀번호 변경',
        description: 'Updates the logged-in user password. / 로그인한 사용자의 비밀번호를 변경합니다.',
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'USER',
        action: 'CHANGE_MY_PASSWORD',
        extractMetadata: (req) => ({ body: req.body }),
    })
    @ApiStandardResponse(Object, {
        status: HttpStatus.OK,
        description: 'Successfully changed password',
    })
    async changePassword(
        @CurrentUser() user: AuthTypes.AuthenticatedUser,
        @Body() dto: ProfileChangePasswordRequestDto,
    ): Promise<void> {
        return this.changeMyPasswordService.execute(user.id, dto);
    }

    @Patch('currency')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Update my currency settings / 내 통화 설정 수정',
        description: 'Update the user primary and play currency settings. / 본인의 대표 통화 및 플레이 통화 설정을 수정합니다.',
    })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'USER',
        action: 'UPDATE_MY_CURRENCY',
        extractMetadata: (req) => ({ body: req.body }),
    })
    @ApiStandardResponse(MyProfileResponseDto, {
        status: HttpStatus.OK,
        description: 'Successfully updated currency settings',
    })
    async updateCurrency(
        @CurrentUser() user: AuthTypes.AuthenticatedUser,
        @Body() dto: UpdateMyCurrencyRequestDto,
    ): Promise<MyProfileResponseDto> {
        return this.updateMyCurrencyService.execute(user.id, dto);
    }
}
