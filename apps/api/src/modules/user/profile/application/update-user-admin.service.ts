import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { USER_REPOSITORY } from '../ports/out/user.repository.token';
import type { UserRepositoryPort } from '../ports/out/user.repository.port';
import { User } from '../domain';
import { ExchangeCurrencyCode, UserStatus } from '@prisma/client';

export interface UpdateUserAdminParams {
    id: bigint;
    email?: string | null;
    nickname?: string;
    status?: UserStatus;
    primaryCurrency?: ExchangeCurrencyCode;
    playCurrency?: ExchangeCurrencyCode;
}

@Injectable()
export class UpdateUserAdminService {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
    ) { }

    async execute(params: UpdateUserAdminParams): Promise<User> {
        const user = await this.userRepository.findById(params.id);

        if (!user) {
            throw new NotFoundException('User not found / 사용자를 찾을 수 없습니다.');
        }

        // 이메일 변경을 원할 경우 중복 이메일 체크
        if (params.email && params.email !== user.email) {
            const existingUser = await this.userRepository.findByEmail(params.email);
            if (existingUser) {
                throw new BadRequestException('Email is already in use / 이미 사용 중인 이메일입니다.');
            }
        }

        const updatedUser = user.updateAdmin({
            email: params.email,
            nickname: params.nickname,
            status: params.status,
            primaryCurrency: params.primaryCurrency,
            playCurrency: params.playCurrency,
        });

        return await this.userRepository.save(updatedUser);
    }
}
