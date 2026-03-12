import { Inject, Injectable } from '@nestjs/common';
import { FILE_REPOSITORY } from '../ports/file.repository.token';
import type { FileRepositoryPort } from '../ports/file.repository.port';
import { FileEntity, FileNotFoundException } from '../domain';

@Injectable()
export class GetFileService {
  constructor(
    @Inject(FILE_REPOSITORY)
    private readonly fileRepository: FileRepositoryPort,
  ) { }

  async findById(id: bigint): Promise<FileEntity | null> {
    return this.fileRepository.findById(id);
  }

  async getById(id: bigint): Promise<FileEntity> {
    const file = await this.findById(id);
    if (!file) {
      throw new FileNotFoundException();
    }
    return file;
  }

  async findByIds(ids: bigint[]): Promise<FileEntity[]> {
    return this.fileRepository.findByIds(ids);
  }
}
