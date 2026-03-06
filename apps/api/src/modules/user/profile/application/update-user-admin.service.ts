import { Injectable, Inject, Optional } from '@nestjs/common';
import { SynchronizeUserSessionService } from 'src/modules/auth/session/application/synchronize-user-session.service';
import { USER_REPOSITORY } from '../ports/out/user.repository.token';
import type { UserRepositoryPort } from '../ports/out/user.repository.port';
import { User, UserNotFoundException, DuplicateEmailException, DuplicatePhoneNumberException } from '../domain';
import { ExchangeCurrencyCode, UserStatus, UserRoleType } from '@prisma/client';

export interface UpdateUserAdminParams {
    id: bigint;
    email?: string | null;
    nickname?: string;
    status?: UserStatus;
    role?: UserRoleType;
    primaryCurrency?: ExchangeCurrencyCode;
    playCurrency?: ExchangeCurrencyCode;
    phoneNumber?: string | null;
    isPhoneVerified?: boolean;
}

@Injectable()
export class UpdateUserAdminService {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
        @Optional()
        private readonly synchronizeUserSessionService?: SynchronizeUserSessionService,
    ) { }

    async execute(params: UpdateUserAdminParams): Promise<User> {
        const user = await this.userRepository.findById(params.id);

        if (!user) {
            throw new UserNotFoundException();
        }

        // 이메일 변경을 원할 경우 중복 이메일 체크
        if (params.email && params.email !== user.email) {
            const existingUser = await this.userRepository.findByEmail(params.email);
            if (existingUser) {
                throw new DuplicateEmailException();
            }
        }

        // 휴대폰 번호 변경을 원할 경우 중복 체크
        if (params.phoneNumber && params.phoneNumber !== user.phoneNumber) {
            const existingUser = await this.userRepository.findByPhoneNumber(params.phoneNumber);
            if (existingUser) {
                throw new DuplicatePhoneNumberException();
            }
        }

        const updatedUser = user.updateAdmin({
            email: params.email,
            nickname: params.nickname,
            status: params.status,
            role: params.role,
            primaryCurrency: params.primaryCurrency,
            playCurrency: params.playCurrency,
            phoneNumber: params.phoneNumber,
            isPhoneVerified: params.isPhoneVerified,
        });

        const savedUser = await this.userRepository.save(updatedUser);

        // 세션 정보 동기화 (Redis)
        if (this.synchronizeUserSessionService) {
            await this.synchronizeUserSessionService.execute({
                userId: savedUser.id!,
                updateData: {
                    email: savedUser.email ?? undefined,
                    nickname: savedUser.nickname,
                    status: savedUser.status,
                    role: savedUser.role,
                    language: savedUser.language,
                    primaryCurrency: savedUser.getCurrency().primaryCurrency,
                    timezone: savedUser.getLocation().timezone ?? undefined,
                    isEmailVerified: savedUser.getTrust().isEmailVerified,
                    isPhoneVerified: savedUser.getTrust().isPhoneVerified,
                    isIdentityVerified: savedUser.getTrust().isIdentityVerified,
                    isKycMandatory: savedUser.getTrust().isKycMandatory,
                },
            }).catch(err => {
                // 세션 동기화 실패는 주 비즈니스 로직에 영향을 주지 않도록 로깅만 함
                console.error(`Failed to synchronize user sessions for user ${savedUser.id}:`, err);
            });
        }

        return savedUser;
    }
}
