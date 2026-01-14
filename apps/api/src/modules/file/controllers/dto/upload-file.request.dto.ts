import { IsOptional, IsString } from 'class-validator';

export class UploadFileRequestDto {
    @IsString()
    @IsOptional()
    folder?: string;
}
