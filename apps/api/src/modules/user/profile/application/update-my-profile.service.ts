import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { USER_REPOSITORY } from '../ports/out/user.repository.token';
import type { UserRepositoryPort } from '../ports/out/user.repository.port';
import { MyProfileResponseDto } from '../controllers/user/dto/response/my-profile.response.dto';
import { UpdateMyProfileRequestDto } from '../controllers/user/dto/request/update-my-profile.request.dto';
import { SynchronizeUserSessionService } from 'src/modules/auth/session/application/synchronize-user-session.service';
import { GetMyProfileService } from './get-my-profile.service';

@Injectable()
export class UpdateMyProfileService {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
        private readonly getMyProfileService: GetMyProfileService,
        private readonly synchronizeUserSessionService: SynchronizeUserSessionService,
    ) { }

    async execute(userId: bigint, dto: UpdateMyProfileRequestDto): Promise<MyProfileResponseDto> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundException('User not found / 사용자를 찾을 수 없습니다.');
        }

        // 닉네임 중복 체크 (수정하려는 경우)
        if (dto.nickname && dto.nickname !== user.nickname) {
            const existingUser = await this.userRepository.findByNickname(dto.nickname);
            if (existingUser) {
                throw new BadRequestException('Nickname is already in use / 이미 사용 중인 닉네임입니다.');
            }
        }

        const updatedUser = user.updateProfile({
            nickname: dto.nickname,
            language: dto.language,
            timezone: dto.timezone,
            phoneNumber: dto.phoneNumber,
        });

        const savedUser = await this.userRepository.save(updatedUser);

        // 세션 정보 실시간 동기화 (Redis)
        await this.synchronizeUserSessionService.execute({
            userId: savedUser.id!,
            updateData: {
                nickname: savedUser.nickname,
                language: savedUser.language,
                timezone: savedUser.getLocation().timezone ?? undefined,
                isPhoneVerified: savedUser.getTrust().isPhoneVerified,
            },
        }).catch(err => {
            // 동기화 실패는 로그만 남김
            console.error(`Failed to sync session for user ${savedUser.id}:`, err);
        });

        return this.getMyProfileService.execute(savedUser.id!);
    }
}
