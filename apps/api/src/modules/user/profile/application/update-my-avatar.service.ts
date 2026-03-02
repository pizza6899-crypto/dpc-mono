import { Injectable, Inject, Logger } from '@nestjs/common';
import { USER_REPOSITORY } from '../ports/out/user.repository.token';
import type { UserRepositoryPort } from '../ports/out/user.repository.port';
import { AttachFileService } from 'src/modules/file/application/attach-file.service';
import { FileUsageType } from 'src/modules/file/domain';
import { EnvService } from 'src/common/env/env.service';
import { UserNotFoundException } from '../domain';
import { MyProfileResponseDto } from '../controllers/user/dto/response/my-profile.response.dto';
import { GetMyProfileService } from './get-my-profile.service';
import { Transactional } from '@nestjs-cls/transactional';

@Injectable()
export class UpdateMyAvatarService {
    private readonly logger = new Logger(UpdateMyAvatarService.name);

    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
        private readonly attachFileService: AttachFileService,
        private readonly envService: EnvService,
        private readonly getMyProfileService: GetMyProfileService,
    ) { }

    @Transactional()
    async execute(userId: bigint, fileId: string): Promise<MyProfileResponseDto> {
        // 1. Check user
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new UserNotFoundException();
        }

        // 2. Attach file via File module
        // USER_PROFILE usage type is already configured as PUBLIC in file-usage.policy.ts
        const { files } = await this.attachFileService.execute({
            fileIds: [fileId],
            usageType: FileUsageType.USER_AVATAR,
            usageId: userId,
        });

        const attachedFile = files[0];

        // 3. Construct URL
        // We use cdnUrl from EnvService as base
        const cdnUrl = this.envService.app.cdnUrl.endsWith('/')
            ? this.envService.app.cdnUrl.slice(0, -1)
            : this.envService.app.cdnUrl;

        const avatarUrl = `${cdnUrl}/${attachedFile.key}`;

        // 4. Update user
        const updatedUser = user.updateProfile({ avatarUrl });
        await this.userRepository.save(updatedUser);

        this.logger.log(`Avatar updated for user ${userId}: ${avatarUrl}`);

        // 5. Return updated profile
        return this.getMyProfileService.execute(userId);
    }
}
