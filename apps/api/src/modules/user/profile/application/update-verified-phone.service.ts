import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../ports/out/user.repository.token';
import type { UserRepositoryPort } from '../ports/out/user.repository.port';
import { User, UserNotFoundException } from '../domain';

@Injectable()
export class UpdateVerifiedPhoneService {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
    ) { }

    async execute(userId: bigint, phoneNumber: string): Promise<User> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new UserNotFoundException();
        }

        const updatedUser = user.verifyAndSetPhoneNumber(phoneNumber);
        return this.userRepository.save(updatedUser);
    }
}
