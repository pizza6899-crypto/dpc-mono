import { Injectable, Inject } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { USER_REPOSITORY } from '../ports/out/user.repository.token';
import type { UserRepositoryPort } from '../ports/out/user.repository.port';
import { MyProfileResponseDto } from '../controllers/user/dto/response/my-profile.response.dto';
import { UpdateNicknameRequestDto } from '../controllers/user/dto/request/update-nickname.request.dto';
import { SynchronizeUserSessionService } from 'src/modules/auth/session/application/synchronize-user-session.service';
import { GetMyProfileService } from './get-my-profile.service';
import { GetUserConfigService } from 'src/modules/user/config/application/get-user-config.service';
import {
    UserNotFoundException,
    NicknameSameAsCurrentException,
    DuplicateNicknameException,
    InvalidNicknameException,
} from '../domain';
import { ModerationService } from 'src/modules/moderation/application/moderation.service';

@Injectable()
export class UpdateMyNicknameService {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
        private readonly getMyProfileService: GetMyProfileService,
        private readonly synchronizeUserSessionService: SynchronizeUserSessionService,
        private readonly moderationService: ModerationService,
        private readonly getUserConfigService: GetUserConfigService,
    ) { }

    @Transactional()
    async execute(userId: bigint, dto: UpdateNicknameRequestDto): Promise<MyProfileResponseDto> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new UserNotFoundException();
        }

        // 1. 닉네임 기본 검증 (중복 & 형식)
        if (dto.nickname === user.nickname) {
            throw new NicknameSameAsCurrentException();
        }

        // 2. 전역 설정(UserConfig)의 정규식 검증 적용
        const config = await this.getUserConfigService.execute();
        if (config.nicknameRegex && !new RegExp(config.nicknameRegex).test(dto.nickname)) {
            throw new InvalidNicknameException();
        }

        const existingUser = await this.userRepository.findByNickname(dto.nickname);
        if (existingUser) {
            throw new DuplicateNicknameException();
        }

        // 3. 모더레이션 체크 (금지어 및 AI 검토)
        await this.moderationService.verify(dto.nickname);

        const updatedUser = user.updateProfile({
            nickname: dto.nickname,
        });

        const savedUser = await this.userRepository.save(updatedUser);

        const result = await this.getMyProfileService.execute(savedUser.id!);

        // 세션 정보 실시간 동기화 (Redis)
        await this.synchronizeUserSessionService.execute({
            userId: savedUser.id!,
            updateData: {
                nickname: savedUser.nickname,
            },
        }).catch(err => {
            console.error(`Failed to sync session for user ${savedUser.id}:`, err);
        });

        return result;
    }
}
