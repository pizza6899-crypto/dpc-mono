import { Inject, Injectable } from '@nestjs/common';
import { FileEntity, FileNotFoundException } from '../domain';
import { FILE_REPOSITORY } from '../ports/file.repository.token';
import { type FileRepositoryPort } from '../ports/file.repository.port';

@Injectable()
export class FindFileService {
    constructor(
        @Inject(FILE_REPOSITORY)
        private readonly repository: FileRepositoryPort,
    ) { }

    async findById(id: bigint): Promise<FileEntity | null> {
        return await this.repository.findById(id);
    }

    async getById(id: bigint): Promise<FileEntity> {
        const file = await this.repository.findById(id);
        if (!file) {
            throw new FileNotFoundException(id);
        }
        return file;
    }

    async findByKey(key: string): Promise<FileEntity | null> {
        return await this.repository.findByKey(key);
    }
}
