import { Injectable, Inject } from '@nestjs/common';
import { USER_REPOSITORY } from '../ports/out/user.repository.token';
import type { UserRepositoryPort } from '../ports/out/user.repository.port';
import { MyProfileResponseDto } from '../controllers/user/dto/response/my-profile.response.dto';
import { UpdateMyProfileRequestDto } from '../controllers/user/dto/request/update-my-profile.request.dto';
import { SynchronizeUserSessionService } from 'src/modules/auth/session/application/synchronize-user-session.service';
import { GetMyProfileService } from './get-my-profile.service';
import { UserNotFoundException } from '../domain';

@Injectable()
export class UpdateMyProfileService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    private readonly getMyProfileService: GetMyProfileService,
    private readonly synchronizeUserSessionService: SynchronizeUserSessionService,
  ) {}

  async execute(
    userId: bigint,
    dto: UpdateMyProfileRequestDto,
  ): Promise<MyProfileResponseDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    const updatedUser = user.updateProfile({
      language: dto.language,
      timezone: dto.timezone,
      phoneNumber: dto.phoneNumber,
    });

    const savedUser = await this.userRepository.save(updatedUser);

    const result = await this.getMyProfileService.execute(savedUser.id);

    // 세션 정보 실시간 동기화 (Redis)
    await this.synchronizeUserSessionService
      .execute({
        userId: savedUser.id,
        updateData: {
          language: savedUser.language,
          timezone: savedUser.getLocation().timezone ?? undefined,
          isPhoneVerified: savedUser.getTrust().isPhoneVerified,
        },
      })
      .catch((err) => {
        // 동기화 실패는 로그만 남김
        console.error(`Failed to sync session for user ${savedUser.id}:`, err);
      });

    return result;
  }
}
