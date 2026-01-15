import { FileEntity } from '../domain';

export interface FileRepositoryPort {
    create(file: FileEntity): Promise<FileEntity>;
    findById(id: bigint): Promise<FileEntity | null>;
    findByKey(key: string): Promise<FileEntity | null>;
    delete(id: bigint): Promise<void>;
}
