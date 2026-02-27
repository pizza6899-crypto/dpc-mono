import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from 'src/modules/user/profile/ports/out/user.repository.token';
import type { UserRepositoryPort } from 'src/modules/user/profile/ports/out/user.repository.port';
import { AvailabilityField } from '../controllers/user/dto/request/check-availability.request.dto';
import { GetUserConfigService } from '../../config/application/get-user-config.service';
import { ModerationService, ModerationOptions } from 'src/modules/moderation/application/moderation.service';
import { LoginIdType } from '@prisma/client';

export interface CheckAvailabilityParams {
    field: AvailabilityField;
    value: string;
    options?: ModerationOptions;
}

export interface CheckAvailabilityResult {
    available: boolean;
    message: string;
}

/**
 * 닉네임, 이메일, 로그인 ID 등 특정 필드의 중복 여부를 검사하는 서비스
 */
@Injectable()
export class CheckAvailabilityService {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
        private readonly getUserConfigService: GetUserConfigService,
        private readonly moderationService: ModerationService,
    ) { }

    async execute(params: CheckAvailabilityParams): Promise<CheckAvailabilityResult> {
        const { field, value } = params;

        // 1. 전역 설정 조회
        const config = await this.getUserConfigService.execute();

        // 2. 형식 검증 (Regex)
        let regex: string | null = null;
        let formatErrorMessage = 'Invalid format.';

        switch (field) {
            case AvailabilityField.NICKNAME:
                regex = config.nicknameRegex;
                formatErrorMessage = 'Nickname format is invalid.';
                break;
            case AvailabilityField.EMAIL:
                regex = config.loginIdEmailRegex;
                formatErrorMessage = 'Email format is invalid.';
                break;
            case AvailabilityField.LOGIN_ID:
                // 현재 설정된 로그인 ID 타입에 맞는 정규식 적용
                if (config.loginIdType === LoginIdType.EMAIL) regex = config.loginIdEmailRegex;
                else if (config.loginIdType === LoginIdType.PHONE_NUMBER) regex = config.loginIdPhoneNumberRegex;
                else if (config.loginIdType === LoginIdType.USERNAME) regex = config.loginIdUsernameRegex;
                formatErrorMessage = 'Login ID format is invalid.';
                break;
            case AvailabilityField.PHONE_NUMBER:
                regex = config.loginIdPhoneNumberRegex;
                formatErrorMessage = 'Phone number format is invalid.';
                break;
        }

        if (regex && !new RegExp(regex).test(value)) {
            return {
                available: false,
                message: formatErrorMessage,
            };
        }

        // 2.5. 콘텐츠 검토 (예약어 / 사칭)
        // AI 검토 여부를 옵션에 따라 결정합니다. (기본값: false, 실시간 체크용)
        if (field === AvailabilityField.NICKNAME || (field === AvailabilityField.LOGIN_ID && config.loginIdType === LoginIdType.USERNAME)) {
            const moderationResult = await this.moderationService.inspect(value, params.options || { includeAi: false });
            if (!moderationResult.isAllowed) {
                return {
                    available: false,
                    message: moderationResult.message,
                };
            }
        }

        // 3. DB 중복 검사
        let isDuplicate = false;

        switch (field) {
            case AvailabilityField.NICKNAME:
                isDuplicate = !!(await this.userRepository.findByNickname(value));
                break;
            case AvailabilityField.EMAIL:
                isDuplicate = !!(await this.userRepository.findByEmail(value));
                break;
            case AvailabilityField.LOGIN_ID:
                isDuplicate = !!(await this.userRepository.findByLoginId(value));
                break;
            case AvailabilityField.PHONE_NUMBER:
                isDuplicate = !!(await this.userRepository.findByPhoneNumber(value));
                break;
        }

        return {
            available: !isDuplicate,
            message: isDuplicate
                ? `This ${field} is unavailable.`
                : `This ${field} is available.`,
        };
    }
}
