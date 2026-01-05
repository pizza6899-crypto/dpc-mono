// src/modules/user/application/get-user.service.ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../domain';
import { USER_REPOSITORY } from '../ports/out/user.repository.token';
import type { UserRepositoryPort } from '../ports/out/user.repository.port';

@Injectable()
export class GetUserService {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
    ) { }

    async findById(id: bigint): Promise<User | null> {
        return this.userRepository.findById(id);
    }

    async findByUid(uid: string): Promise<User | null> {
        return this.userRepository.findByUid(uid);
    }

    async getById(id: bigint): Promise<User> {
        const user = await this.findById(id);
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    async getByUid(uid: string): Promise<User> {
        const user = await this.findByUid(uid);
        if (!user) {
            throw new NotFoundException(`User with UID ${uid} not found`);
        }
        return user;
    }
}
