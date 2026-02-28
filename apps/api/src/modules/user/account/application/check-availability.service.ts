import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from 'src/modules/user/profile/ports/out/user.repository.token';
import type { UserRepositoryPort } from 'src/modules/user/profile/ports/out/user.repository.port';
import { GetUserConfigService } from '../../config/application/get-user-config.service';
import { ModerationService } from 'src/modules/moderation/application/moderation.service';
import { ForbiddenWordException } from 'src/modules/moderation/domain';
import { LoginIdType } from '@prisma/client';
import { isDisposableEmailDomain } from 'disposable-email-domains-js';

export enum AvailabilityField {
    NICKNAME = 'nickname',
    LOGIN_ID = 'loginId',
    EMAIL = 'email',
}

export interface CheckAvailabilityParams {
    field: AvailabilityField;
    value: string;
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
            case AvailabilityField.LOGIN_ID:
                // 현재 설정된 로그인 ID 타입에 맞는 정규식 적용
                if (config.loginIdType === LoginIdType.EMAIL) regex = config.loginIdEmailRegex;
                else if (config.loginIdType === LoginIdType.PHONE_NUMBER) regex = config.loginIdPhoneNumberRegex;
                else if (config.loginIdType === LoginIdType.USERNAME) regex = config.loginIdUsernameRegex;
                formatErrorMessage = 'Login ID format is invalid.';
                break;
            case AvailabilityField.EMAIL:
                regex = config.loginIdEmailRegex; // 기본적으로 이메일 정규식 사용
                formatErrorMessage = 'Email format is invalid.';
                break;
        }

        if (regex && !new RegExp(regex).test(value)) {
            return {
                available: false,
                message: formatErrorMessage,
            };
        }

        // 2.2. 일회용 이메일 검사 (이메일 필드이거나 로그인ID가 이메일인 경우)
        if (field === AvailabilityField.EMAIL || (field === AvailabilityField.LOGIN_ID && config.loginIdType === LoginIdType.EMAIL)) {
            if (this.isDisposableEmail(value)) {
                return {
                    available: false,
                    message: 'Disposable email addresses are not allowed.',
                };
            }
        }

        // 2.5. 콘텐츠 검토 (예약어 / 사칭 / 금지어)
        if (field === AvailabilityField.NICKNAME || (field === AvailabilityField.LOGIN_ID && config.loginIdType === LoginIdType.USERNAME)) {
            try {
                await this.moderationService.verify(value, { skipAi: true });
            } catch (error) {
                if (error instanceof ForbiddenWordException) {
                    return {
                        available: false,
                        message: error.message,
                    };
                }
                throw error;
            }
        }

        // 3. DB 중복 검사
        let isDuplicate = false;

        switch (field) {
            case AvailabilityField.NICKNAME:
                isDuplicate = !!(await this.userRepository.findByNickname(value));
                break;
            case AvailabilityField.LOGIN_ID:
                isDuplicate = !!(await this.userRepository.findByLoginId(value));
                break;
            case AvailabilityField.EMAIL:
                isDuplicate = !!(await this.userRepository.findByEmail(value));
                break;
        }

        return {
            available: !isDuplicate,
            message: isDuplicate
                ? `This ${field} is unavailable.`
                : `This ${field} is available.`,
        };
    }

    /**
     * 일회용 이메일 여부 확인
     */
    private isDisposableEmail(email: string): boolean {
        try {
            const domain = email.split('@')[1];
            if (!domain) return false;

            return isDisposableEmailDomain(domain);
        } catch (error) {
            // 에러 발생 시 안전하게 가입을 허용하거나 로그를 남깁니다.
            return false;
        }
    }
}
