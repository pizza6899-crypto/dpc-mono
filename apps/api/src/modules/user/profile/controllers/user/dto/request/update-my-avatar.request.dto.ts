import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateMyAvatarRequestDto {
    @ApiProperty({
        description: 'File ID or key for the new avatar / 새로운 아바타 이미지의 파일 ID 또는 키',
        example: 'file_id_123'
    })
    @IsNotEmpty()
    @IsString()
    fileId: string;
}
