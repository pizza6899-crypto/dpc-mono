import { Injectable } from '@nestjs/common';
import { StorageService } from 'src/infrastructure/storage/storage.service';
import { nanoid } from 'nanoid';
import * as path from 'path';

@Injectable()
export class UploadFileService {
    constructor(private readonly storageService: StorageService) { }

    async execute(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
        const fileExtension = path.extname(file.originalname);
        const fileName = `${nanoid()}${fileExtension}`;
        const key = `${folder}/${fileName}`;

        await this.storageService.upload(key, file.buffer, file.mimetype);

        // TODO: 전체 URL을 반환하거나, CDN URL이 설정되어 있다면 결합해서 반환
        // 현재는 Key를 반환하고, 필요시 Presigned URL을 받거나 CDN URL과 결합하도록 함
        // 클라이언트 편의를 위해 일단 Key를 반환. (컨트롤러에서 URL 생성 로직을 추가할 수도 있음)
        // 하지만 "이미지 업로드"의 경우 바로 볼 수 있는 URL이 편할 수 있음.

        // public-read가 아니므로 Presigned URL이 필요할 수 있으나,
        // 보통 이미지 에셋은 CloudFront 연결을 가정하므로 
        // 여기서는 key만 반환하고, 필요한 곳에서 URL을 조합하는 것이 유연함.
        // 하지만 사용성을 위해 Key를 반환하는 것이 일반적.

        return key;
    }
}
