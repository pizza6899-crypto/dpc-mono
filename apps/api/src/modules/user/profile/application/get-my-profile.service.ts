import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY } from '../ports/out/user.repository.token';
import type { UserRepositoryPort } from '../ports/out/user.repository.port';
import { MyProfileResponseDto } from '../controllers/user/dto/response/my-profile.response.dto';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';

@Injectable()
export class GetMyProfileService {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
        private readonly sqidsService: SqidsService,
    ) { }

    async execute(userId: bigint): Promise<MyProfileResponseDto> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundException('User not found / 사용자를 찾을 수 없습니다.');
        }

        return {
            id: this.sqidsService.encode(user.id, SqidsPrefix.USER),
            loginId: user.loginId,
            nickname: user.nickname,
            email: user.email,
            role: user.role,
            status: user.status,
            language: user.language,
            country: user.getLocation().country,
            timezone: user.getLocation().timezone,
            primaryCurrency: user.getCurrency().primaryCurrency,
            playCurrency: user.getCurrency().playCurrency,
            isEmailVerified: user.getTrust().isEmailVerified,
            isPhoneVerified: user.getTrust().isPhoneVerified,
            phoneNumber: user.phoneNumber,
            createdAt: user.createdAt,
        };
    }
}
